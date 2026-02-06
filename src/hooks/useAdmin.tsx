import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Reward } from "@/lib/supabase-types";

export interface AdminStats {
  totalUsers: number;
  totalActivities: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  totalRedemptions: number;
  activeWearableConnections: number;
}

export interface UserWithStats {
  id: string;
  email: string;
  created_at: string;
  balance: number;
  total_activities: number;
  total_credits_earned: number;
  is_admin: boolean;
}

export function useAdmin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if current user is admin
  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });

  // Fetch admin statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStats> => {
      // Get total users count
      const { count: totalUsers } = await supabase
        .from("user_credits")
        .select("*", { count: "exact", head: true });

      // Get total activities
      const { count: totalActivities } = await supabase
        .from("activities")
        .select("*", { count: "exact", head: true });

      // Get total credits earned (sum from activities)
      const { data: creditsData } = await supabase
        .from("activities")
        .select("credits_earned");
      const totalCreditsEarned = creditsData?.reduce((sum, a) => sum + a.credits_earned, 0) || 0;

      // Get total redemptions
      const { data: redemptionsData, count: totalRedemptions } = await supabase
        .from("redemptions")
        .select("credits_spent", { count: "exact" });
      const totalCreditsSpent = redemptionsData?.reduce((sum, r) => sum + r.credits_spent, 0) || 0;

      // Get active wearable connections
      const { count: activeWearableConnections } = await supabase
        .from("wearable_connections")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      return {
        totalUsers: totalUsers || 0,
        totalActivities: totalActivities || 0,
        totalCreditsEarned,
        totalCreditsSpent,
        totalRedemptions: totalRedemptions || 0,
        activeWearableConnections: activeWearableConnections || 0,
      };
    },
    enabled: isAdmin === true,
  });

  // Fetch all rewards
  const { data: rewards, isLoading: isLoadingRewards } = useQuery({
    queryKey: ["admin-rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Reward[];
    },
    enabled: isAdmin === true,
  });

  // Create reward
  const createReward = useMutation({
    mutationFn: async (reward: Omit<Reward, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("rewards")
        .insert(reward)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });

  // Update reward
  const updateReward = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Reward> & { id: string }) => {
      const { data, error } = await supabase
        .from("rewards")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });

  // Delete reward
  const deleteReward = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rewards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });

  // Fetch users with their stats (for moderation)
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<UserWithStats[]> => {
      // Get all user credits (represents all users)
      const { data: userCredits, error: creditsError } = await supabase
        .from("user_credits")
        .select("user_id, balance, created_at");
      if (creditsError) throw creditsError;

      // Get admin roles
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const adminUserIds = new Set(adminRoles?.map((r) => r.user_id) || []);

      // Get activity stats per user
      const { data: activityStats } = await supabase
        .from("activities")
        .select("user_id, credits_earned");

      const activityMap = new Map<string, { count: number; credits: number }>();
      activityStats?.forEach((a) => {
        const current = activityMap.get(a.user_id) || { count: 0, credits: 0 };
        activityMap.set(a.user_id, {
          count: current.count + 1,
          credits: current.credits + a.credits_earned,
        });
      });

      return (userCredits || []).map((uc) => ({
        id: uc.user_id,
        email: "Usuario", // Auth emails are not accessible via public API
        created_at: uc.created_at,
        balance: uc.balance,
        total_activities: activityMap.get(uc.user_id)?.count || 0,
        total_credits_earned: activityMap.get(uc.user_id)?.credits || 0,
        is_admin: adminUserIds.has(uc.user_id),
      }));
    },
    enabled: isAdmin === true,
  });

  // Toggle admin role
  const toggleAdminRole = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      if (makeAdmin) {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  return {
    isAdmin: isAdmin ?? false,
    isCheckingAdmin,
    stats,
    isLoadingStats,
    rewards: rewards ?? [],
    isLoadingRewards,
    createReward,
    updateReward,
    deleteReward,
    users: users ?? [],
    isLoadingUsers,
    toggleAdminRole,
  };
}
