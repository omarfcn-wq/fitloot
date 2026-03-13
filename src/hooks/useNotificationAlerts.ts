import { useCallback, useRef } from "react";

const NOTIFICATION_SOUND_FREQUENCY = 800;
const NOTIFICATION_SOUND_DURATION = 150;

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.value = NOTIFICATION_SOUND_FREQUENCY;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + NOTIFICATION_SOUND_DURATION / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + NOTIFICATION_SOUND_DURATION / 1000);

    oscillator.onended = () => ctx.close();
  } catch {
    // AudioContext not available
  }
}

function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });
  } catch {
    // Some mobile browsers/webviews don't support Notification constructor reliably
  }
}

export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function useNotificationAlerts() {
  const isFirstLoad = useRef(true);

  const triggerAlert = useCallback((title: string, message: string) => {
    // Skip alerts on initial data load
    if (isFirstLoad.current) return;
    playNotificationSound();
    showBrowserNotification(title, message);
  }, []);

  const markLoaded = useCallback(() => {
    isFirstLoad.current = false;
  }, []);

  return { triggerAlert, markLoaded };
}
