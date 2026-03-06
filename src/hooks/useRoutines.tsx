import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
    mutationFn: async ({ routineId, durationMinutes }: { routineId: string; durationMinutes: number }) => {
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase
        .from("user_routine_progress")
        .insert({ user_id: user.id, routine_id: routineId, duration_minutes: durationMinutes });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-routine-progress"] });
      toast.success("¡Rutina completada! 💪");
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
