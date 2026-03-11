import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCredits } from "./useCredits";
import type { Reward } from "@/lib/supabase-types";

export function useRewards() {
  const { user } = useAuth();
  const { credits } = useCredits();
  const queryClient = useQueryClient();

  const { data: rewards, isLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .eq("is_available", true)
        .order("credits_cost", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: redemptions } = useQuery({
    queryKey: ["redemptions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("redemptions")
        .select("*, rewards(*)")
        .eq("user_id", user.id)
        .order("redeemed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const redeemReward = useMutation({
    mutationFn: async (reward: Reward) => {
      if (!user) throw new Error("No autenticado");
      
      const { data, error } = await supabase.rpc("redeem_reward", {
        p_reward_id: reward.id,
      });
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || "Error al canjear");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["redemptions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["credits", user?.id] });
    },
  });
 
   return {
     rewards: rewards ?? [],
     redemptions: redemptions ?? [],
     isLoading,
     redeemReward: redeemReward.mutate,
     isRedeeming: redeemReward.isPending,
     canAfford: (cost: number) => credits >= cost,
   };
 }