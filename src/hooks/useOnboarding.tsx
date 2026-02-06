import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

const ONBOARDING_KEY = "trust_score_onboarding_completed";

export function useOnboarding() {
  const { user } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (user) {
      const key = `${ONBOARDING_KEY}_${user.id}`;
      const completed = localStorage.getItem(key) === "true";
      setHasCompletedOnboarding(completed);
      
      // Auto-show tutorial for new users after a brief delay
      if (!completed) {
        const timer = setTimeout(() => {
          setShowTutorial(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const completeOnboarding = () => {
    if (user) {
      const key = `${ONBOARDING_KEY}_${user.id}`;
      localStorage.setItem(key, "true");
      setHasCompletedOnboarding(true);
      setShowTutorial(false);
    }
  };

  const resetOnboarding = () => {
    if (user) {
      const key = `${ONBOARDING_KEY}_${user.id}`;
      localStorage.removeItem(key);
      setHasCompletedOnboarding(false);
    }
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
