import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useReferrals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: referralCode, isLoading: isLoadingCode } = useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_referral_codes")
        .select("referral_code")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.referral_code ?? null;
    },
    enabled: !!user,
  });

  const { data: referrals = [], isLoading: isLoadingReferrals } = useQuery({
    queryKey: ["referrals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: hasUsedReferral } = useQuery({
    queryKey: ["has-used-referral", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("referrals")
        .select("id")
        .eq("referred_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });

  const applyReferralCode = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc("process_referral", {
        p_referral_code: code,
      });
      if (error) throw error;
      const result = data as unknown as { success: boolean; error?: string; credits?: number };
      if (!result.success) {
        throw new Error(result.error || "Error al procesar el código");
      }
      return result;
    },
    onSuccess: (data) => {
      toast.success(`¡Código aplicado! Ganaste ${data.credits} créditos`);
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["has-used-referral"] });
      queryClient.invalidateQueries({ queryKey: ["user-credits"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const totalEarned = referrals.reduce((sum, r) => sum + (r.credits_awarded ?? 0), 0);

  return {
    referralCode,
    referrals,
    totalEarned,
    hasUsedReferral: !!hasUsedReferral,
    isLoading: isLoadingCode || isLoadingReferrals,
    applyReferralCode: applyReferralCode.mutate,
    isApplying: applyReferralCode.isPending,
  };
}
