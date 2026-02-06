import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Activity } from "@/lib/supabase-types";

export const CREDITS_PER_MINUTE = 2;
export const PAGE_SIZE = 10;

export type PenaltyFilter = "all" | "penalized" | "not_penalized";

interface UseActivityHistoryOptions {
  activityType: string;
  penaltyFilter: PenaltyFilter;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  page: number;
}

interface ActivityStats {
  total: number;
  totalMinutes: number;
  totalCredits: number;
  totalBaseCredits: number;
  creditsLost: number;
  penalizedCount: number;
  penalizedPercentage: number;
}

export function useActivityHistory({
  activityType,
  penaltyFilter,
  dateFrom,
  dateTo,
  page,
}: UseActivityHistoryOptions) {
  const { user } = useAuth();

  // Fetch total count for pagination (with server-side filters)
  const { data: totalCount = 0 } = useQuery({
    queryKey: ["activity-history-count", user?.id, activityType, dateFrom, dateTo],
    queryFn: async () => {
      if (!user) return 0;

      let query = supabase
        .from("activities")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Apply server-side filters
      if (activityType !== "all") {
        query = query.eq("activity_type", activityType);
      }
      if (dateFrom) {
        query = query.gte("completed_at", dateFrom.toISOString());
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("completed_at", endOfDay.toISOString());
      }

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  // Fetch paginated activities with server-side filters
  const { data: activities, isLoading } = useQuery({
    queryKey: ["activity-history", user?.id, activityType, dateFrom, dateTo, page],
    queryFn: async () => {
      if (!user) return [];

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .range(from, to);

      // Apply server-side filters
      if (activityType !== "all") {
        query = query.eq("activity_type", activityType);
      }
      if (dateFrom) {
        query = query.gte("completed_at", dateFrom.toISOString());
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("completed_at", endOfDay.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!user,
  });

  // Apply client-side penalty filter
  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    if (penaltyFilter === "all") return activities;

    return activities.filter((activity) => {
      const baseCredits = activity.duration_minutes * CREDITS_PER_MINUTE;
      const isPenalized = activity.credits_earned < baseCredits;
      if (penaltyFilter === "penalized") return isPenalized;
      return !isPenalized;
    });
  }, [activities, penaltyFilter]);

  // Fetch all activities for stats (separate query without pagination)
  const { data: allActivitiesForStats } = useQuery({
    queryKey: ["activity-history-stats", user?.id, activityType, dateFrom, dateTo],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("activities")
        .select("duration_minutes, credits_earned")
        .eq("user_id", user.id);

      if (activityType !== "all") {
        query = query.eq("activity_type", activityType);
      }
      if (dateFrom) {
        query = query.gte("completed_at", dateFrom.toISOString());
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("completed_at", endOfDay.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate stats from all filtered activities
  const stats: ActivityStats = useMemo(() => {
    const data = allActivitiesForStats ?? [];
    
    // Apply penalty filter for stats too
    const filtered = penaltyFilter === "all" 
      ? data 
      : data.filter((a) => {
          const baseCredits = a.duration_minutes * CREDITS_PER_MINUTE;
          const isPenalized = a.credits_earned < baseCredits;
          return penaltyFilter === "penalized" ? isPenalized : !isPenalized;
        });

    const total = filtered.length;
    const totalMinutes = filtered.reduce((sum, a) => sum + a.duration_minutes, 0);
    const totalCredits = filtered.reduce((sum, a) => sum + a.credits_earned, 0);
    const totalBaseCredits = filtered.reduce(
      (sum, a) => sum + a.duration_minutes * CREDITS_PER_MINUTE,
      0
    );
    const penalizedCount = filtered.filter(
      (a) => a.credits_earned < a.duration_minutes * CREDITS_PER_MINUTE
    ).length;

    return {
      total,
      totalMinutes,
      totalCredits,
      totalBaseCredits,
      creditsLost: totalBaseCredits - totalCredits,
      penalizedCount,
      penalizedPercentage: total > 0 ? Math.round((penalizedCount / total) * 100) : 0,
    };
  }, [allActivitiesForStats, penaltyFilter]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return {
    activities: filteredActivities,
    isLoading,
    stats,
    totalCount,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
