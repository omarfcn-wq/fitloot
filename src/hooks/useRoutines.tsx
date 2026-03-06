import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { calculateTrustScore, applyTrustScoreToCredits } from "@/lib/trust-score";
import { applyEffortMultiplier } from "@/lib/effort-multiplier";
import { toast } from "sonner";

const CREDITS_PER_MINUTE = 2;

export interface Trainer {
  id: string;
  name: string;
  country: string;
  country_flag: string;
  bio: string | null;
  specialty: string;
  avatar_url: string | null;
  social_url: string | null;
  is_active: boolean;
}

export interface Exercise {
  name: string;
  reps: string;
  rest: string;
}

export interface Routine {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  difficulty: string;
  duration_minutes: number;
  category: string;
  video_url: string | null;
  thumbnail_url: string | null;
  exercises: Exercise[];
  is_published: boolean;
  trainer?: Trainer;
}

export function useRoutines() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const { data: trainers = [], isLoading: trainersLoading } = useQuery({
    queryKey: ["trainers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainers")
        .select("*")
        .eq("is_active", true)
        .order("created_at");
      if (error) throw error;
      return data as Trainer[];
    },
  });

  const { data: routines = [], isLoading: routinesLoading } = useQuery({
    queryKey: ["routines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("routines")
        .select("*, trainer:trainers(*)")
        .eq("is_published", true)
        .order("created_at");
      if (error) throw error;
      return (data as any[]).map((r) => ({
        ...r,
        exercises: r.exercises as Exercise[],
        trainer: r.trainer as Trainer,
      })) as Routine[];
    },
  });

  const { data: completedRoutines = [] } = useQuery({
    queryKey: ["user-routine-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_routine_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const completeRoutine = useMutation({
    mutationFn: async ({ routineId, durationMinutes, category }: { routineId: string; durationMinutes: number; category: string }) => {
      if (!user) throw new Error("No autenticado");

      // 1. Record routine progress
      const { error: progressError } = await supabase
        .from("user_routine_progress")
        .insert({ user_id: user.id, routine_id: routineId, duration_minutes: durationMinutes });
      if (progressError) throw progressError;

      // 2. Log as activity via secure RPC to earn credits
      const trustResult = calculateTrustScore({
        activityType: category,
        durationMinutes,
        source: "routine",
      });
      const baseCredits = durationMinutes * CREDITS_PER_MINUTE;
      const { adjustedCredits: trustAdjusted } = applyTrustScoreToCredits(baseCredits, trustResult.score);
      const { adjustedCredits } = applyEffortMultiplier(
        trustAdjusted,
        profile?.weight_kg,
        profile?.height_cm
      );

      const { data, error: activityError } = await supabase.rpc("log_activity", {
        p_activity_type: category,
        p_duration_minutes: durationMinutes,
        p_credits_earned: adjustedCredits,
        p_trust_score: trustResult.score,
        p_trust_flags: trustResult.flags,
        p_source: "routine",
      });
      if (activityError) throw activityError;
      const result = data as unknown as { success: boolean; credits_earned?: number; error?: string };
      if (!result.success) throw new Error(result.error || "Error al registrar actividad");

      return { creditsEarned: result.credits_earned ?? adjustedCredits };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-routine-progress"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      toast.success(`¡Rutina completada! +${data.creditsEarned} créditos 💪`);
    },
    onError: () => toast.error("Error al registrar la rutina"),
  });

  return {
    trainers,
    routines,
    completedRoutines,
    trainersLoading,
    routinesLoading,
    completeRoutine,
    getRoutinesByTrainer: (trainerId: string) => routines.filter((r) => r.trainer_id === trainerId),
    getCompletionCount: (routineId: string) => completedRoutines.filter((c) => c.routine_id === routineId).length,
  };
}
