/**
 * Effort Multiplier based on user profile (BMI).
 *
 * Users with higher BMI (overweight/obese) exert more effort for the same
 * activity, so they earn a bonus on credits. Fitter users receive the
 * standard rate.
 *
 * BMI categories (WHO):
 *   < 18.5          Underweight   → 1.0x
 *   18.5 – 24.9     Normal        → 1.0x
 *   25.0 – 29.9     Overweight    → 1.25x
 *   30.0 – 34.9     Obese I       → 1.5x
 *   ≥ 35            Obese II+     → 2.0x
 */

export interface EffortMultiplierResult {
  multiplier: number;
  bmi: number | null;
  category: "underweight" | "normal" | "overweight" | "obese_i" | "obese_ii" | "unknown";
  label: string;
}

/**
 * Calculate BMI from weight (kg) and height (cm).
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/**
 * Get the effort multiplier for a user based on their profile data.
 * Returns 1.0 if profile data is incomplete.
 */
export function getEffortMultiplier(
  weightKg: number | null | undefined,
  heightCm: number | null | undefined
): EffortMultiplierResult {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) {
    return { multiplier: 1.0, bmi: null, category: "unknown", label: "Sin datos" };
  }

  const bmi = calculateBMI(weightKg, heightCm);

  if (bmi >= 35) {
    return { multiplier: 2.0, bmi, category: "obese_ii", label: "Esfuerzo máximo (2x)" };
  }
  if (bmi >= 30) {
    return { multiplier: 1.5, bmi, category: "obese_i", label: "Esfuerzo alto (1.5x)" };
  }
  if (bmi >= 25) {
    return { multiplier: 1.25, bmi, category: "overweight", label: "Esfuerzo moderado (1.25x)" };
  }
  if (bmi >= 18.5) {
    return { multiplier: 1.0, bmi, category: "normal", label: "Estándar (1x)" };
  }
  return { multiplier: 1.0, bmi, category: "underweight", label: "Estándar (1x)" };
}

/**
 * Apply effort multiplier to credits.
 */
export function applyEffortMultiplier(
  credits: number,
  weightKg: number | null | undefined,
  heightCm: number | null | undefined
): { adjustedCredits: number; effort: EffortMultiplierResult } {
  const effort = getEffortMultiplier(weightKg, heightCm);
  return {
    adjustedCredits: Math.round(credits * effort.multiplier),
    effort,
  };
}
