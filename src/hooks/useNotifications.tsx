import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useNotificationAlerts, requestNotificationPermission } from "./useNotificationAlerts";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  icon: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useNotifications() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { triggerAlert, markLoaded } = useNotificationAlerts();
  const prevCountRef = useRef<number | null>(null);

  // Request browser notification permission after auth is ready
  useEffect(() => {
    if (!authLoading && user) {
      requestNotificationPermission();
    }
  }, [authLoading, user]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });

  // Detect new notifications and trigger alerts
  useEffect(() => {
    if (!user) {
      prevCountRef.current = null;
      return;
    }

    const currentCount = notifications.length;

    // Initialize baseline without firing alert on first authenticated load
    if (prevCountRef.current === null) {
      prevCountRef.current = currentCount;
      markLoaded();
      return;
    }

    if (currentCount > prevCountRef.current) {
      const newest = notifications[0];
      if (newest) {
        triggerAlert(newest.title, newest.message);
      }
    }

    prevCountRef.current = currentCount;
    markLoaded();
  }, [user, notifications, triggerAlert, markLoaded]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  // Create a notification for trust score changes (called from activities hook)
  const createTrustScoreNotification = useMutation({
    mutationFn: async ({
      trustScore,
      activityType,
      creditsEarned,
      baseCredits,
    }: {
      trustScore: number;
      activityType: string;
      creditsEarned: number;
      baseCredits: number;
    }) => {
      if (!user) return;

      // Only notify if there's a significant penalty
      if (trustScore >= 70) return;

      const penaltyPercent = Math.round((1 - creditsEarned / baseCredits) * 100);
      
      const { error } = await supabase.from("notifications").insert({
        user_id: user.id,
        type: "trust_score",
        title: trustScore < 50 ? "⚠️ Trust Score Bajo" : "📊 Trust Score Reducido",
        message: `Tu actividad de ${activityType} recibió un Trust Score de ${trustScore}. Créditos reducidos un ${penaltyPercent}% (${baseCredits} → ${creditsEarned}).`,
        icon: "shield-alert",
        metadata: { trustScore, activityType, creditsEarned, baseCredits },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    clearAll: clearAll.mutate,
    createTrustScoreNotification: createTrustScoreNotification.mutate,
  };
}
