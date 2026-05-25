import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getPaddleEnvironment } from "@/lib/paddle";

export function useSubscription() {
  const { user } = useAuth();
  const env = getPaddleEnvironment();

  const query = useQuery({
    queryKey: ["subscription", user?.id, env],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const sub = query.data;
  const now = Date.now();
  const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end).getTime() : null;

  const isActive = !!sub && (
    (["active", "trialing", "past_due"].includes(sub.status) && (!periodEnd || periodEnd > now)) ||
    (sub.status === "canceled" && periodEnd && periodEnd > now)
  );

  return { subscription: sub, isPremium: !!isActive, isLoading: query.isLoading };
}
