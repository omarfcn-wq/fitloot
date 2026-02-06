import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type WearableProvider = "fitbit" | "google_fit" | "apple_health";

export interface WearableConnection {
  id: string;
  user_id: string;
  provider: WearableProvider;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
}

export function useWearables() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const { data: connections, isLoading } = useQuery({
    queryKey: ["wearable-connections", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wearable_connections")
        .select("id, user_id, provider, is_active, last_sync_at, created_at")
        .eq("user_id", user.id)
        .eq("is_active", true);
      if (error) throw error;
      return data as WearableConnection[];
    },
    enabled: !!user,
  });

  const connectWearable = useMutation({
    mutationFn: async (provider: WearableProvider) => {
      if (!session?.access_token) throw new Error("No session");

      const functionName = provider === "fitbit" ? "fitbit-auth" : "google-fit-auth";
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("No auth URL returned");

      // Redirect to OAuth provider
      window.location.href = data.url;
    },
  });

  const disconnectWearable = useMutation({
    mutationFn: async (provider: WearableProvider) => {
      if (!session?.access_token) throw new Error("No session");

      const { error } = await supabase.functions.invoke("disconnect-wearable", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { provider },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wearable-connections", user?.id] });
    },
  });

  const syncActivities = useMutation({
    mutationFn: async (provider?: WearableProvider) => {
      if (!session?.access_token) throw new Error("No session");

      const { data, error } = await supabase.functions.invoke("sync-wearable-activities", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: provider ? { provider } : {},
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wearable-connections", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["activities", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["user-credits", user?.id] });
    },
  });

  const isConnected = (provider: WearableProvider) => {
    return connections?.some((c) => c.provider === provider && c.is_active) ?? false;
  };

  const getConnection = (provider: WearableProvider) => {
    return connections?.find((c) => c.provider === provider);
  };

  return {
    connections: connections ?? [],
    isLoading,
    connectWearable: connectWearable.mutate,
    isConnecting: connectWearable.isPending,
    disconnectWearable: disconnectWearable.mutate,
    isDisconnecting: disconnectWearable.isPending,
    syncActivities: syncActivities.mutate,
    isSyncing: syncActivities.isPending,
    isConnected,
    getConnection,
  };
}
