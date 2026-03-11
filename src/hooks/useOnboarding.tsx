import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

const ONBOARDING_KEY = "trust_score_onboarding_completed";

function getOnboardingCompleted(key: string) {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    // Fallback seguro para entornos donde localStorage está restringido
    return true;
  }
}

function setOnboardingCompleted(key: string, completed: boolean) {
  try {
    if (completed) {
      localStorage.setItem(key, "true");
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignorar errores de storage para evitar crash de la app
  }
}

export function useOnboarding() {
  const { user } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!user) return;

    const key = `${ONBOARDING_KEY}_${user.id}`;
    const completed = getOnboardingCompleted(key);
    setHasCompletedOnboarding(completed);

    // Evitar auto-popup en móvil (causaba pantalla negra en algunos dispositivos)
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!completed && !isMobile) {
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const completeOnboarding = () => {
    if (!user) return;

    const key = `${ONBOARDING_KEY}_${user.id}`;
    setOnboardingCompleted(key, true);
    setHasCompletedOnboarding(true);
    setShowTutorial(false);
  };

  const resetOnboarding = () => {
    if (!user) return;

    const key = `${ONBOARDING_KEY}_${user.id}`;
    setOnboardingCompleted(key, false);
    setHasCompletedOnboarding(false);
  };

  const openTutorial = () => setShowTutorial(true);
  const closeTutorial = () => setShowTutorial(false);

  return {
    hasCompletedOnboarding,
    showTutorial,
    openTutorial,
    closeTutorial,
    completeOnboarding,
    resetOnboarding,
  };
}

