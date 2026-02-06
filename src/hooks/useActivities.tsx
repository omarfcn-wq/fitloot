import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCredits } from "./useCredits";
import type { ActivityInsert } from "@/lib/supabase-types";

const CREDITS_PER_MINUTE = 2;

export function useActivities() {
  const { user } = useAuth();
  const { addCredits } = useCredits();
  const queryClient = useQueryClient();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["activities", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const logActivity = useMutation({
    mutationFn: async ({
      activityType,
      durationMinutes,
    }: {
      activityType: string;
      durationMinutes: number;
    }) => {
      if (!user) throw new Error("No user");
      
      const creditsEarned = durationMinutes * CREDITS_PER_MINUTE;
      
      const activityData: ActivityInsert = {
        user_id: user.id,
        activity_type: activityType,
        duration_minutes: durationMinutes,
        credits_earned: creditsEarned,
        source: "manual",
      };
      
      const { error } = await supabase.from("activities").insert(activityData);
      if (error) throw error;
      
      addCredits(creditsEarned);
      
      return creditsEarned;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", user?.id] });
      // Invalidate user stats to trigger achievement check
      queryClient.invalidateQueries({ queryKey: ["user_stats", user?.id] });
    },
  });

  const totalCreditsEarned = activities?.reduce(
    (sum, activity) => sum + activity.credits_earned,
    0
  ) ?? 0;

  return {
    activities: activities ?? [],
    isLoading,
    logActivity: logActivity.mutate,
    isLogging: logActivity.isPending,
    totalCreditsEarned,
  };
}