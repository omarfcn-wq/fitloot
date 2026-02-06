import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCredits } from "./useCredits";
import type { ActivityInsert } from "@/lib/supabase-types";
import { calculateTrustScore, applyTrustScoreToCredits } from "@/lib/trust-score";

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

  // Fetch validation rules for trust score calculation
  const { data: validationRules } = useQuery({
    queryKey: ["activity_validation_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_validation_rules")
        .select("*");
      if (error) throw error;
      return data;
    },
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
      
      // Calculate trust score for manual activity
      const trustResult = calculateTrustScore(
        {
          activityType,
          durationMinutes,
          source: "manual",
          // No biometric data for manual entries
        },
        validationRules ?? undefined
      );
      
      // Calculate base credits and apply trust score multiplier
      const baseCredits = durationMinutes * CREDITS_PER_MINUTE;
      const { adjustedCredits, multiplier } = applyTrustScoreToCredits(
        baseCredits,
        trustResult.score
      );
      
      const activityData: ActivityInsert = {
        user_id: user.id,
        activity_type: activityType,
        duration_minutes: durationMinutes,
        credits_earned: adjustedCredits,
        source: "manual",
        trust_score: trustResult.score,
        trust_flags: trustResult.flags,
      };
      
      const { error } = await supabase.from("activities").insert(activityData);
      if (error) throw error;
      
      addCredits(adjustedCredits);
      
      return { 
        creditsEarned: adjustedCredits, 
        baseCredits,
        multiplier,
        trustScore: trustResult.score 
      };
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

  // Calculate average trust score
  const averageTrustScore = activities && activities.length > 0
    ? Math.round(
        activities.reduce((sum, a) => sum + (a.trust_score ?? 100), 0) / activities.length
      )
    : 100;

  return {
    activities: activities ?? [],
    isLoading,
    logActivity: logActivity.mutate,
    isLogging: logActivity.isPending,
    totalCreditsEarned,
    averageTrustScore,
  };
}