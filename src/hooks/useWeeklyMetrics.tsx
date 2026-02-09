import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { startOfWeek, endOfWeek, subWeeks, format, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Activity {
  id: string;
  activity_type: string;
  duration_minutes: number;
  credits_earned: number;
  calories_burned: number | null;
  trust_score: number | null;
  completed_at: string;
}

interface DailyMetric {
  day: string;
  dayShort: string;
  minutes: number;
  credits: number;
  calories: number;
  activities: number;
}

interface WeekSummary {
  totalMinutes: number;
  totalCredits: number;
  totalCalories: number;
  totalActivities: number;
  avgTrustScore: number;
  dailyMetrics: DailyMetric[];
  byType: { type: string; minutes: number; count: number }[];
}

export function useWeeklyMetrics() {
  const { user } = useAuth();

  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const { data: currentWeekActivities = [], isLoading: isLoadingCurrent } = useQuery({
    queryKey: ["weekly-activities-current", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .gte("completed_at", currentWeekStart.toISOString())
        .lte("completed_at", currentWeekEnd.toISOString())
        .order("completed_at", { ascending: true });
      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!user,
  });

  const { data: prevWeekActivities = [], isLoading: isLoadingPrev } = useQuery({
    queryKey: ["weekly-activities-prev", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .gte("completed_at", prevWeekStart.toISOString())
        .lte("completed_at", prevWeekEnd.toISOString())
        .order("completed_at", { ascending: true });
      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!user,
  });

  const buildWeekSummary = (activities: Activity[], weekStart: Date, weekEnd: Date): WeekSummary => {
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const dailyMetrics: DailyMetric[] = days.map((day) => {
      const dayActivities = activities.filter((a) =>
        isSameDay(parseISO(a.completed_at), day)
      );
      return {
        day: format(day, "yyyy-MM-dd"),
        dayShort: format(day, "EEE", { locale: es }),
        minutes: dayActivities.reduce((s, a) => s + a.duration_minutes, 0),
        credits: dayActivities.reduce((s, a) => s + a.credits_earned, 0),
        calories: dayActivities.reduce((s, a) => s + (a.calories_burned ?? 0), 0),
        activities: dayActivities.length,
      };
    });

    const trustScores = activities
      .map((a) => a.trust_score)
      .filter((s): s is number => s !== null);

    const typeMap = new Map<string, { minutes: number; count: number }>();
    activities.forEach((a) => {
      const existing = typeMap.get(a.activity_type) ?? { minutes: 0, count: 0 };
      typeMap.set(a.activity_type, {
        minutes: existing.minutes + a.duration_minutes,
        count: existing.count + 1,
      });
    });

    return {
      totalMinutes: activities.reduce((s, a) => s + a.duration_minutes, 0),
      totalCredits: activities.reduce((s, a) => s + a.credits_earned, 0),
      totalCalories: activities.reduce((s, a) => s + (a.calories_burned ?? 0), 0),
      totalActivities: activities.length,
      avgTrustScore:
        trustScores.length > 0
          ? Math.round(trustScores.reduce((s, v) => s + v, 0) / trustScores.length)
          : 100,
      dailyMetrics,
      byType: Array.from(typeMap.entries()).map(([type, data]) => ({
        type,
        ...data,
      })),
    };
  };

  const currentWeek = useMemo(
    () => buildWeekSummary(currentWeekActivities, currentWeekStart, currentWeekEnd),
    [currentWeekActivities]
  );

  const prevWeek = useMemo(
    () => buildWeekSummary(prevWeekActivities, prevWeekStart, prevWeekEnd),
    [prevWeekActivities]
  );

  const comparisons = useMemo(() => {
    const pct = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };
    return {
      minutes: pct(currentWeek.totalMinutes, prevWeek.totalMinutes),
      credits: pct(currentWeek.totalCredits, prevWeek.totalCredits),
      calories: pct(currentWeek.totalCalories, prevWeek.totalCalories),
      activities: pct(currentWeek.totalActivities, prevWeek.totalActivities),
    };
  }, [currentWeek, prevWeek]);

  const weekLabel = `${format(currentWeekStart, "d MMM", { locale: es })} - ${format(currentWeekEnd, "d MMM", { locale: es })}`;

  return {
    currentWeek,
    prevWeek,
    comparisons,
    weekLabel,
    isLoading: isLoadingCurrent || isLoadingPrev,
  };
}
