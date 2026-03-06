import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { startOfWeek, subWeeks, format, differenceInDays } from "date-fns";

interface WeekSnapshot {
  weekLabel: string;
  weekStart: string;
  totalMinutes: number;
  totalCalories: number;
  totalActivities: number;
  avgTrustScore: number;
  activeDays: number;
  score: number;
}

export interface FitnessScoreData {
  overallScore: number;
  frequencyScore: number;
  durationScore: number;
  consistencyScore: number;
  varietyScore: number;
  intensityScore: number;
  weeklyTrend: WeekSnapshot[];
  totalActiveDays: number;
  longestStreak: number;
  currentStreak: number;
  favoriteActivity: string;
  totalWeeksActive: number;
  isLoading: boolean;
}

function calcScore(value: number, max: number): number {
  return Math.min(100, Math.round((value / max) * 100));
}

export function useFitnessScore(): FitnessScoreData {
  const { user } = useAuth();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["fitness-all-activities", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return useMemo(() => {
    if (activities.length === 0) {
      return {
        overallScore: 0,
        frequencyScore: 0,
        durationScore: 0,
        consistencyScore: 0,
        varietyScore: 0,
        intensityScore: 0,
        weeklyTrend: [],
        totalActiveDays: 0,
        longestStreak: 0,
        currentStreak: 0,
        favoriteActivity: "—",
        totalWeeksActive: 0,
        isLoading,
      };
    }

    const now = new Date();

    // --- Active days & streaks ---
    const uniqueDays = new Set(
      activities.map((a) => format(new Date(a.completed_at), "yyyy-MM-dd"))
    );
    const totalActiveDays = uniqueDays.size;
    const sortedDays = Array.from(uniqueDays).sort();

    let longestStreak = 1;
    let currentStreak = 1;
    let streak = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const diff = differenceInDays(new Date(sortedDays[i]), new Date(sortedDays[i - 1]));
      if (diff === 1) {
        streak++;
        longestStreak = Math.max(longestStreak, streak);
      } else {
        streak = 1;
      }
    }
    // Current streak
    const today = format(now, "yyyy-MM-dd");
    const yesterday = format(new Date(now.getTime() - 86400000), "yyyy-MM-dd");
    if (sortedDays[sortedDays.length - 1] === today || sortedDays[sortedDays.length - 1] === yesterday) {
      currentStreak = 1;
      for (let i = sortedDays.length - 2; i >= 0; i--) {
        const diff = differenceInDays(new Date(sortedDays[i + 1]), new Date(sortedDays[i]));
        if (diff === 1) currentStreak++;
        else break;
      }
    } else {
      currentStreak = 0;
    }

    // --- Weekly snapshots (last 8 weeks) ---
    const weeklyTrend: WeekSnapshot[] = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = startOfWeek(subWeeks(now, w), { weekStartsOn: 1 });
      const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
      const weekActivities = activities.filter((a) => {
        const d = new Date(a.completed_at);
        return d >= weekStart && d < weekEnd;
      });

      const totalMinutes = weekActivities.reduce((s, a) => s + a.duration_minutes, 0);
      const totalCalories = weekActivities.reduce((s, a) => s + (a.calories_burned || 0), 0);
      const trustScores = weekActivities.filter((a) => a.trust_score != null).map((a) => a.trust_score!);
      const avgTrustScore = trustScores.length > 0 ? Math.round(trustScores.reduce((s, v) => s + v, 0) / trustScores.length) : 100;
      const activeDays = new Set(weekActivities.map((a) => format(new Date(a.completed_at), "yyyy-MM-dd"))).size;

      // Week score: weighted combo of active days and minutes
      const dayScore = calcScore(activeDays, 5); // 5 days/week = perfect
      const minScore = calcScore(totalMinutes, 150); // 150 min/week WHO recommendation
      const score = Math.round(dayScore * 0.5 + minScore * 0.5);

      weeklyTrend.push({
        weekLabel: format(weekStart, "dd/MM"),
        weekStart: weekStart.toISOString(),
        totalMinutes,
        totalCalories,
        totalActivities: weekActivities.length,
        avgTrustScore,
        activeDays,
        score,
      });
    }

    // --- Last 4 weeks for scoring ---
    const last4 = weeklyTrend.slice(-4);
    const recentActivities = activities.filter(
      (a) => new Date(a.completed_at) >= subWeeks(now, 4)
    );

    // Frequency: avg active days per week (target: 5)
    const avgActiveDays = last4.reduce((s, w) => s + w.activeDays, 0) / 4;
    const frequencyScore = calcScore(avgActiveDays, 5);

    // Duration: avg weekly minutes (WHO: 150 min)
    const avgWeeklyMinutes = last4.reduce((s, w) => s + w.totalMinutes, 0) / 4;
    const durationScore = calcScore(avgWeeklyMinutes, 150);

    // Consistency: how many of last 4 weeks had ≥3 active days
    const consistentWeeks = last4.filter((w) => w.activeDays >= 3).length;
    const consistencyScore = calcScore(consistentWeeks, 4);

    // Variety: unique activity types (target: 3+)
    const uniqueTypes = new Set(recentActivities.map((a) => a.activity_type));
    const varietyScore = calcScore(uniqueTypes.size, 3);

    // Intensity: avg calories per minute (target: ~8 cal/min)
    const totalMins = recentActivities.reduce((s, a) => s + a.duration_minutes, 0);
    const totalCals = recentActivities.reduce((s, a) => s + (a.calories_burned || 0), 0);
    const calPerMin = totalMins > 0 ? totalCals / totalMins : 0;
    const intensityScore = calcScore(calPerMin, 8);

    // Overall: weighted average
    const overallScore = Math.round(
      frequencyScore * 0.25 +
      durationScore * 0.25 +
      consistencyScore * 0.25 +
      varietyScore * 0.1 +
      intensityScore * 0.15
    );

    // Favorite activity
    const typeCounts: Record<string, number> = {};
    activities.forEach((a) => {
      typeCounts[a.activity_type] = (typeCounts[a.activity_type] || 0) + 1;
    });
    const favoriteActivity = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    const weeksWithActivity = new Set(
      activities.map((a) => format(startOfWeek(new Date(a.completed_at), { weekStartsOn: 1 }), "yyyy-ww"))
    );

    return {
      overallScore,
      frequencyScore,
      durationScore,
      consistencyScore,
      varietyScore,
      intensityScore,
      weeklyTrend,
      totalActiveDays,
      longestStreak,
      currentStreak,
      favoriteActivity,
      totalWeeksActive: weeksWithActivity.size,
      isLoading,
    };
  }, [activities, isLoading]);
}
