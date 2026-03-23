import { useCallback, useRef } from "react";

const NOTIFICATION_SOUND_FREQUENCY = 800;
const NOTIFICATION_SOUND_DURATION = 150;

function isMobileLikeEnvironment() {
  if (typeof window === "undefined") return false;

  try {
    const userAgent = navigator.userAgent || "";
    const isMobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
    const isCapacitor = !!(window as any).Capacitor || /CapacitorApp/i.test(userAgent);
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isSmallScreen = window.innerWidth <= 768;

    return isMobileUa || isCapacitor || isStandalone || isSmallScreen;
  } catch {
    return true; // Fail safe: treat as mobile
  }
}

function playNotificationSound() {
  if (typeof window === "undefined" || isMobileLikeEnvironment()) return;

  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.frequency.value = NOTIFICATION_SOUND_FREQUENCY;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + NOTIFICATION_SOUND_DURATION / 1000);

    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => undefined);
    }

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + NOTIFICATION_SOUND_DURATION / 1000);

    oscillator.onended = () => {
      void ctx.close().catch(() => undefined);
    };
  } catch {
    // Audio APIs not available in this environment
  }
}

function showBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || isMobileLikeEnvironment()) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });
  } catch {
    // Some browsers/webviews don't support Notification constructor reliably
  }
}

export function requestNotificationPermission() {
  if (typeof window === "undefined" || isMobileLikeEnvironment()) return;
  if (!("Notification" in window) || Notification.permission !== "default") return;

  try {
    const permissionResult = Notification.requestPermission();
    if (permissionResult instanceof Promise) {
      void permissionResult.catch(() => undefined);
    }
  } catch {
    // Ignore permission request failures in unsupported environments
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
