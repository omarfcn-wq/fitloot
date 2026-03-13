import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useNotificationAlerts } from "./useNotificationAlerts";

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
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const { triggerAlert, markLoaded } = useNotificationAlerts();
  const prevCountRef = useRef<number | null>(null);
  const queryKey = ["notifications", userId] as const;

  const { data: notifications = [], isLoading } = useQuery({
    queryKey,
    enabled: Boolean(userId) && !authLoading,
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Notification[];
    },
  });

  useEffect(() => {
    if (!userId) {
      prevCountRef.current = null;
      return;
    }

    const currentCount = notifications.length;

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
  }, [userId, notifications, triggerAlert, markLoaded]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, queryKey]);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!userId) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!userId) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!userId) return;

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      if (!userId) return;

      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

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
      if (!userId) return;
      if (trustScore >= 70) return;
      if (baseCredits <= 0) return;

      const penaltyPercent = Math.round((1 - creditsEarned / baseCredits) * 100);

      const { error } = await supabase.from("notifications").insert({
        user_id: userId,
        type: "trust_score",
        title: trustScore < 50 ? "⚠️ Trust Score Bajo" : "📊 Trust Score Reducido",
        message: `Tu actividad de ${activityType} recibió un Trust Score de ${trustScore}. Créditos reducidos un ${penaltyPercent}% (${baseCredits} → ${creditsEarned}).`,
        icon: "shield-alert",
        metadata: { trustScore, activityType, creditsEarned, baseCredits },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
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
