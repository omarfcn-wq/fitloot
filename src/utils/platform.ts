export function isMobileLikeEnvironment() {
  if (typeof window === "undefined") return false;

  try {
    const userAgent = navigator.userAgent || "";
    const isMobileUa = /Android|iPhone|iPad|iPod|Mobile|CapacitorApp/i.test(userAgent);
    const isCapacitor = Boolean((window as typeof window & { Capacitor?: unknown }).Capacitor);
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isTouchPhone = navigator.maxTouchPoints > 0 && Math.min(window.screen.width, window.screen.height) <= 820;
    const isSmallViewport = window.innerWidth <= 820;

    return isMobileUa || isCapacitor || isStandalone || isTouchPhone || isSmallViewport;
  } catch {
    return true;
  }
}

export function installMobileCrashGuard() {
  if (typeof window === "undefined" || !isMobileLikeEnvironment()) return;

  try {
    localStorage.setItem("fitloot_mobile_shell_refresh_v4", "done");
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => void registration.unregister());
      });
    }
    if ("caches" in window) {
      void caches.keys().then((names) => names.forEach((name) => void caches.delete(name)));
    }
  } catch {
    // Storage, service worker, or cache APIs may be restricted in mobile webviews.
  }

  const showRecoveryScreen = (message: string) => {
    const root = document.getElementById("root");
    if (!root || root.childElementCount > 0) return;

    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:hsl(222 47% 4%);color:hsl(0 0% 100%);padding:24px;font-family:system-ui,sans-serif;text-align:center">
        <div style="max-width:360px">
          <div style="font-size:44px;margin-bottom:12px">⚠️</div>
          <h1 style="font-size:22px;margin:0 0 8px">FitLoot necesita recargarse</h1>
          <p style="color:hsl(215 20% 72%);margin:0 0 20px">${message}</p>
          <button onclick="window.location.reload()" style="background:hsl(142 76% 36%);color:white;border:0;border-radius:8px;padding:12px 18px;font-weight:700">Recargar</button>
        </div>
      </div>
    `;
  };

  window.addEventListener("error", (event) => {
    window.setTimeout(() => {
      const root = document.getElementById("root");
      if (!root || root.childElementCount === 0) {
        showRecoveryScreen(event.message || "Se bloqueó un componente en móvil.");
      }
    }, 600);
  });

  window.addEventListener("unhandledrejection", () => {
    window.setTimeout(() => {
      const root = document.getElementById("root");
      if (!root || root.childElementCount === 0) {
        showRecoveryScreen("Hubo un problema cargando datos.");
      }
    }, 600);
  });

  window.setTimeout(() => {
    const root = document.getElementById("root");
    if (!root || root.childElementCount === 0) {
      showRecoveryScreen("La versión anterior quedó cacheada. Recarga para limpiar el teléfono.");
    }
  }, 1800);
}