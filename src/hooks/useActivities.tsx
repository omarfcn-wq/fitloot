import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { ActivityInsert } from "@/lib/supabase-types";
import { calculateTrustScore, applyTrustScoreToCredits } from "@/lib/trust-score";

const CREDITS_PER_MINUTE = 2;

export function useActivities() {
  const { user } = useAuth();
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
        },
        validationRules ?? undefined
      );
      
      // Calculate base credits and apply trust score multiplier
      const baseCredits = durationMinutes * CREDITS_PER_MINUTE;
      const { adjustedCredits, multiplier } = applyTrustScoreToCredits(
        baseCredits,
        trustResult.score
      );
      
      // Use SECURITY DEFINER RPC instead of direct insert
      const { data, error } = await supabase.rpc("log_activity", {
        p_activity_type: activityType,
        p_duration_minutes: durationMinutes,
        p_credits_earned: adjustedCredits,
        p_trust_score: trustResult.score,
        p_trust_flags: trustResult.flags,
        p_source: "manual",
      });
      
      if (error) throw error;
      const result = data as unknown as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || "Error al registrar actividad");
      }
      
      return { 
        creditsEarned: adjustedCredits, 
        baseCredits,
        multiplier,
        trustScore: trustResult.score 
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["credits", user?.id] });
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