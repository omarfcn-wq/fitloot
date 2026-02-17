import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

// XP required per level (increases with each level)
const XP_PER_LEVEL = 100;
const XP_MULTIPLIER = 1.5;

export function calculateLevelFromXP(xp: number): { level: number; currentLevelXP: number; nextLevelXP: number } {
  let level = 1;
  let totalXPForLevel = XP_PER_LEVEL;
  let xpRemaining = xp;

  while (xpRemaining >= totalXPForLevel) {
    xpRemaining -= totalXPForLevel;
    level++;
    totalXPForLevel = Math.floor(XP_PER_LEVEL * Math.pow(XP_MULTIPLIER, level - 1));
  }

  return {
    level,
    currentLevelXP: xpRemaining,
    nextLevelXP: totalXPForLevel,
  };
}

export function useAchievements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_active", true)
        .order("requirement_value", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch user's earned achievements
  const { data: userAchievements, isLoading: userAchievementsLoading } = useQuery({
    queryKey: ["user_achievements", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*, achievements(*)")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user's level
  const { data: userLevel, isLoading: levelLoading } = useQuery({
    queryKey: ["user_level", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_levels")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  // Get user stats for achievement checking
  const { data: userStats } = useQuery({
    queryKey: ["user_stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: activities, error } = await supabase
        .from("activities")
        .select("duration_minutes, credits_earned, completed_at")
        .eq("user_id", user.id);
      
      if (error) throw error;

      const totalActivities = activities?.length || 0;
      const totalMinutes = activities?.reduce((sum, a) => sum + a.duration_minutes, 0) || 0;
      const totalCredits = activities?.reduce((sum, a) => sum + a.credits_earned, 0) || 0;
      
      // Calculate streak
      const streak = calculateStreak(activities?.map(a => a.completed_at) || []);

      return { totalActivities, totalMinutes, totalCredits, streak };
    },
    enabled: !!user,
  });

  // Earn achievement mutation
  const earnAchievement = useMutation({
    mutationFn: async (achievementId: string) => {
      if (!user) throw new Error("No user");
      
      // Use SECURITY DEFINER RPC instead of direct insert
      const { data, error } = await supabase.rpc("earn_achievement", {
        p_achievement_id: achievementId,
      });
      
      if (error) throw error;
      const result = data as unknown as { success: boolean; error?: string; xp_reward?: number; new_xp?: number; new_level?: number };
      if (!result.success) {
        if (result.error === 'Logro ya obtenido') return null; // Already earned, silent
        throw new Error(result.error || "Error al obtener logro");
      }

      const achievement = achievements?.find(a => a.id === achievementId);
      return { achievement, newXP: result.new_xp, level: result.new_level, xpReward: result.xp_reward };
    },
    onSuccess: (data) => {
      if (data?.achievement) {
        toast.success(`🏆 ¡Logro desbloqueado: ${data.achievement.name}!`, {
          description: `+${data.xpReward} XP`,
        });
        queryClient.invalidateQueries({ queryKey: ["user_achievements", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["user_level", user?.id] });
      }
    },
  });

  // Check and award achievements
  const checkAchievements = async () => {
    if (!user || !achievements || !userStats) return;

    const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

    for (const achievement of achievements) {
      if (earnedIds.has(achievement.id)) continue;

      let earned = false;
      switch (achievement.requirement_type) {
        case "activities_count":
          earned = userStats.totalActivities >= achievement.requirement_value;
          break;
        case "total_minutes":
          earned = userStats.totalMinutes >= achievement.requirement_value;
          break;
        case "credits_earned":
          earned = userStats.totalCredits >= achievement.requirement_value;
          break;
        case "streak_days":
          earned = userStats.streak >= achievement.requirement_value;
          break;
      }

      if (earned) {
        await earnAchievement.mutateAsync(achievement.id);
      }
    }
  };

  const levelInfo = userLevel 
    ? calculateLevelFromXP(userLevel.current_xp)
    : { level: 1, currentLevelXP: 0, nextLevelXP: XP_PER_LEVEL };

  return {
    achievements: achievements ?? [],
    userAchievements: userAchievements ?? [],
    userLevel,
    levelInfo,
    userStats,
    isLoading: achievementsLoading || userAchievementsLoading || levelLoading,
    checkAchievements,
    hasAchievement: (id: string) => userAchievements?.some(ua => ua.achievement_id === id) ?? false,
  };
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = [...dates]
    .map(d => new Date(d).toDateString())
    .filter((date, i, arr) => arr.indexOf(date) === i)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 1;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastActivityDate = new Date(sortedDates[0]);
  if (
    lastActivityDate.toDateString() !== today.toDateString() &&
    lastActivityDate.toDateString() !== yesterday.toDateString()
  ) {
    return 0;
  }

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const previous = new Date(sortedDates[i + 1]);
    const diffDays = Math.floor((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
