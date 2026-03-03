import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type WearableProvider = 'fitbit' | 'google_fit' | 'apple_health';

export interface WearableConnection {
  id: string;
  provider: WearableProvider;
  provider_user_id: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivitySyncResult {
  success: boolean;
  activitiesAdded: number;
  creditsEarned: number;
  error?: string;
}

export interface SyncAllResult {
  results: {
    [provider: string]: ActivitySyncResult;
  };
}

export interface ConnectionStats {
  activeConnections: number;
  lastSyncAt: string | null;
  totalSyncs: number;
}

export const useWearables = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load connections when user changes
  useEffect(() => {
    if (user) {
      loadConnections();
    } else {
      setConnections([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('wearable_connections')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error: any) {
      console.error('Error loading connections:', error);
      toast.error('Error loading device connections');
    } finally {
      setIsLoading(false);
    }
  };

  const connectWearable = async (provider: WearableProvider) => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    try {
      setIsConnecting(true);
      
      // Call appropriate auth function
      const authFunction = provider === 'fitbit' ? 'fitbit-auth' : 
                          provider === 'google_fit' ? 'google-fit-auth' : null;
                          
      if (!authFunction) {
        throw new Error('Provider not supported yet');
      }

      const { data, error } = await supabase.functions.invoke(authFunction, {
        body: {
          userId: user.id,
          redirectUrl: window.location.href
        }
      });

      if (error) throw error;
      
      if (data.success) {
        // Redirect to provider's OAuth page
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || 'Failed to initiate connection');
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error(Failed to connect ${provider}: ${error.message});
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWearable = async (
    provider: WearableProvider, 
    options?: { onSuccess?: () => void; onError?: () => void }
  ) => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    try {
      setIsDisconnecting(true);

      const { data, error } = await supabase.functions.invoke('disconnect-wearable', {
        body: {
          provider,
          userId: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        await loadConnections(); // Reload connections
        options?.onSuccess?.();      } else {
        throw new Error(data.error || 'Failed to disconnect');
      }
    } catch (error: any) {
      console.error('Disconnect error:', error);
      options?.onError?.();
    } finally {
      setIsDisconnecting(false);
    }
  };

  const syncActivities = async (
    provider: WearableProvider,
    options?: { onSuccess?: (data: ActivitySyncResult) => void; onError?: () => void }
  ) => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    try {
      setIsSyncing(true);

      const { data, error } = await supabase.functions.invoke('sync-wearable-activities', {
        body: {
          provider,
          userId: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        await loadConnections(); // Reload to update sync timestamp
        options?.onSuccess?.(data);
      } else {
        throw new Error(data.error || 'Sync failed');
        options?.onError?.();
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      options?.onError?.();
    } finally {
      setIsSyncing(false);
    }
  };

  const syncAllProviders = async (): Promise<SyncAllResult> => {
    if (!user) {
      throw new Error('Please sign in first');
    }

    const activeConnections = connections.filter(c => c.is_active);
    const results: { [provider: string]: ActivitySyncResult } = {};

    setIsSyncing(true);

    try {
      for (const connection of activeConnections) {
        try {
          const { data, error } = await supabase.functions.invoke('sync-wearable-activities', {
            body: {
              provider: connection.provider,
              userId: user.id
            }
          });

          results[connection.provider] = error ? 
            { success: false, activitiesAdded: 0, creditsEarned: 0, error: error.message } :
            data;
        } catch (error: any) {
          results[connection.provider] = { 
            success: false, 
            activitiesAdded: 0, 
            creditsEarned: 0, 
            error: error.message 
          };
        }
      }

      await loadConnections(); // Reload connections
      return { results };
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper functions
  const getConnection = (provider: WearableProvider): WearableConnection | null => {
    return connections.find(c => c.provider === provider && c.is_active) || null;
  };

  const isConnected = (provider: WearableProvider): boolean => {
    return getConnection(provider) !== null;
  };

  const getConnectionStats = (): ConnectionStats => {
    const activeConnections = connections.filter(c => c.is_active);
    const lastSyncTimes = activeConnections
      .map(c => c.last_sync_at)
      .filter(t => t !== null)
      .sort()
      .reverse();

    return {
      activeConnections: activeConnections.length,
      lastSyncAt: lastSyncTimes[0] || null,
      totalSyncs: activeConnections.reduce((sum, c) => sum + (c.last_sync_at ? 1 : 0), 0)
    };
  };

  return {
    connections,
    isLoading,
    isConnecting,
    isDisconnecting,
    isSyncing,
    connectWearable,
    disconnectWearable,
    syncActivities,
    syncAllProviders,
    getConnection,
    isConnected,
    getConnectionStats,
    loadConnections
  };
};
