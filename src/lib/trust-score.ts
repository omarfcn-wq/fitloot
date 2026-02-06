/**
 * Trust Score Calculator for Activity Fraud Detection
 * 
 * This module implements a Cross-Data Validation (VDC) algorithm
 * to detect potentially fraudulent activity submissions.
 */

export interface ActivityData {
  activityType: string;
  durationMinutes: number;
  source: "manual" | "fitbit" | "google_fit" | "apple_health";
  heartRateAvg?: number;
  heartRateMax?: number;
  caloriesBurned?: number;
  distanceMeters?: number;
}

export interface ValidationRule {
  activity_type: string;
  min_duration_minutes: number;
  max_duration_minutes: number;
  expected_hr_min: number;
  expected_hr_max: number;
  min_calories_per_minute: number;
  max_calories_per_minute: number;
}

export interface TrustScoreResult {
  score: number;
  flags: string[];
  category: "verified" | "trusted" | "suspicious" | "flagged";
}

// Default validation rules (used when DB rules aren't available)
const DEFAULT_RULES: Record<string, Omit<ValidationRule, "activity_type">> = {
  running: { min_duration_minutes: 5, max_duration_minutes: 180, expected_hr_min: 120, expected_hr_max: 190, min_calories_per_minute: 8, max_calories_per_minute: 18 },
  cycling: { min_duration_minutes: 10, max_duration_minutes: 300, expected_hr_min: 100, expected_hr_max: 175, min_calories_per_minute: 5, max_calories_per_minute: 15 },
  gym: { min_duration_minutes: 15, max_duration_minutes: 180, expected_hr_min: 90, expected_hr_max: 170, min_calories_per_minute: 4, max_calories_per_minute: 12 },
  swimming: { min_duration_minutes: 10, max_duration_minutes: 120, expected_hr_min: 110, expected_hr_max: 180, min_calories_per_minute: 7, max_calories_per_minute: 14 },
  hiking: { min_duration_minutes: 20, max_duration_minutes: 480, expected_hr_min: 90, expected_hr_max: 160, min_calories_per_minute: 4, max_calories_per_minute: 10 },
  walking: { min_duration_minutes: 10, max_duration_minutes: 180, expected_hr_min: 70, expected_hr_max: 130, min_calories_per_minute: 2, max_calories_per_minute: 6 },
  yoga: { min_duration_minutes: 15, max_duration_minutes: 120, expected_hr_min: 60, expected_hr_max: 120, min_calories_per_minute: 1, max_calories_per_minute: 4 },
  exercise: { min_duration_minutes: 5, max_duration_minutes: 240, expected_hr_min: 80, expected_hr_max: 175, min_calories_per_minute: 3, max_calories_per_minute: 15 },
};

/**
 * Get validation rule for an activity type
 */
function getRule(activityType: string, customRules?: ValidationRule[]): Omit<ValidationRule, "activity_type"> {
  // Check custom rules first
  if (customRules) {
    const customRule = customRules.find(r => r.activity_type.toLowerCase() === activityType.toLowerCase());
    if (customRule) return customRule;
  }
  
  // Fallback to default rules
  const normalizedType = activityType.toLowerCase();
  return DEFAULT_RULES[normalizedType] ?? DEFAULT_RULES.exercise;
}

/**
 * Calculate trust score for an activity
 * 
 * Score breakdown:
 * - Base score: 100
 * - Source bonus/penalty: +10 (wearable) or -20 (manual without HR)
 * - Duration validation: -10 to -30 for anomalies
 * - Heart rate correlation: -15 to -40 for suspicious patterns
 * - Calorie correlation: -10 to -25 for mismatches
 */
export function calculateTrustScore(
  activity: ActivityData,
  customRules?: ValidationRule[]
): TrustScoreResult {
  let score = 100;
  const flags: string[] = [];
  const rule = getRule(activity.activityType, customRules);

  // 1. Source Validation (+10 for wearable, -20 for manual without biometrics)
  if (activity.source === "manual") {
    if (!activity.heartRateAvg) {
      score -= 20;
      flags.push("manual_no_biometrics");
    } else {
      score -= 10; // Manual with HR is better but still less trusted
      flags.push("manual_with_biometrics");
    }
  } else {
    score += 10; // Wearable bonus
  }

  // 2. Duration Validation
  if (activity.durationMinutes < rule.min_duration_minutes) {
    score -= 15;
    flags.push("duration_too_short");
  } else if (activity.durationMinutes > rule.max_duration_minutes) {
    score -= 25;
    flags.push("duration_exceeds_limit");
  } else if (activity.durationMinutes > rule.max_duration_minutes * 0.8) {
    score -= 5;
    flags.push("duration_near_limit");
  }

  // 3. Heart Rate Correlation (Critical for fraud detection)
  if (activity.heartRateAvg !== undefined && activity.heartRateAvg > 0) {
    // Check if HR is too low for the activity type
    if (activity.heartRateAvg < rule.expected_hr_min * 0.7) {
      score -= 35;
      flags.push("hr_too_low_for_activity");
    } else if (activity.heartRateAvg < rule.expected_hr_min) {
      score -= 15;
      flags.push("hr_below_expected");
    }
    
    // Check if HR is suspiciously high
    if (activity.heartRateAvg > rule.expected_hr_max * 1.2) {
      score -= 20;
      flags.push("hr_abnormally_high");
    }
    
    // Check for suspiciously perfect heart rate (mechanical pattern indicator)
    if (activity.heartRateMax !== undefined && 
        activity.heartRateMax === activity.heartRateAvg) {
      score -= 30;
      flags.push("hr_no_variance_suspicious");
    }
    
    // Check HR/Max ratio (should have some variation during exercise)
    if (activity.heartRateMax !== undefined && activity.heartRateAvg > 0) {
      const hrVariance = (activity.heartRateMax - activity.heartRateAvg) / activity.heartRateAvg;
      if (hrVariance < 0.05 && activity.durationMinutes > 10) {
        score -= 20;
        flags.push("hr_variance_too_low");
      }
    }
  } else if (activity.source !== "manual") {
    // Wearable should have HR data
    score -= 15;
    flags.push("wearable_missing_hr");
  }

  // 4. Calorie Correlation
  if (activity.caloriesBurned !== undefined && activity.caloriesBurned > 0) {
    const caloriesPerMinute = activity.caloriesBurned / activity.durationMinutes;
    
    if (caloriesPerMinute < rule.min_calories_per_minute * 0.5) {
      score -= 20;
      flags.push("calories_too_low");
    } else if (caloriesPerMinute > rule.max_calories_per_minute * 1.5) {
      score -= 25;
      flags.push("calories_unrealistic");
    }
  }

  // 5. Consistency Check (HR should correlate with calories if both present)
  if (activity.heartRateAvg && activity.caloriesBurned && activity.durationMinutes > 0) {
    const expectedCalories = estimateCaloriesFromHR(activity.heartRateAvg, activity.durationMinutes);
    const deviation = Math.abs(activity.caloriesBurned - expectedCalories) / expectedCalories;
    
    if (deviation > 0.5) {
      score -= 15;
      flags.push("hr_calorie_mismatch");
    }
  }

  // Ensure score stays within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine category
  let category: TrustScoreResult["category"];
  if (score >= 90) {
    category = "verified";
  } else if (score >= 70) {
    category = "trusted";
  } else if (score >= 50) {
    category = "suspicious";
  } else {
    category = "flagged";
  }

  return { score, flags, category };
}

/**
 * Estimate calories burned based on heart rate (simplified formula)
 * Using a simplified version of the Keytel formula
 */
function estimateCaloriesFromHR(avgHeartRate: number, durationMinutes: number): number {
  // Simplified estimation assuming average adult
  // Real implementation would consider age, weight, gender
  const caloriesPerMinute = (avgHeartRate - 60) * 0.1;
  return Math.round(caloriesPerMinute * durationMinutes);
}

/**
 * Get display info for trust score
 */
export function getTrustScoreDisplay(score: number): {
  label: string;
  color: string;
  bgColor: string;
  icon: "shield-check" | "shield" | "shield-alert" | "shield-x";
} {
  if (score >= 90) {
    return {
      label: "Verificado",
      color: "text-green-600",
      bgColor: "bg-green-100",
      icon: "shield-check",
    };
  } else if (score >= 70) {
    return {
      label: "Confiable",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      icon: "shield",
    };
  } else if (score >= 50) {
    return {
      label: "Sospechoso",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      icon: "shield-alert",
    };
  } else {
    return {
      label: "Marcado",
      color: "text-red-600",
      bgColor: "bg-red-100",
      icon: "shield-x",
    };
  }
}

/**
 * Get flag explanations in Spanish
 */
export function getFlagExplanation(flag: string): string {
  const explanations: Record<string, string> = {
    manual_no_biometrics: "Actividad manual sin datos biométricos",
    manual_with_biometrics: "Actividad manual con datos biométricos",
    duration_too_short: "Duración muy corta para este tipo de actividad",
    duration_exceeds_limit: "Duración excede el límite esperado",
    duration_near_limit: "Duración cerca del límite máximo",
    hr_too_low_for_activity: "Frecuencia cardíaca muy baja para la actividad",
    hr_below_expected: "Frecuencia cardíaca por debajo de lo esperado",
    hr_abnormally_high: "Frecuencia cardíaca anormalmente alta",
    hr_no_variance_suspicious: "Sin variación en frecuencia cardíaca (patrón mecánico)",
    hr_variance_too_low: "Variación de frecuencia cardíaca muy baja",
    wearable_missing_hr: "Dispositivo sin datos de frecuencia cardíaca",
    calories_too_low: "Calorías quemadas muy bajas",
    calories_unrealistic: "Calorías quemadas irrealmente altas",
    hr_calorie_mismatch: "Discrepancia entre frecuencia cardíaca y calorías",
  };
  
  return explanations[flag] ?? flag;
}

/**
 * Credit multiplier based on trust score.
 * - Score >= 70: 100% credits (trusted/verified)
 * - Score >= 50: 50% credits (suspicious)
 * - Score < 50: 25% credits (flagged)
 */
export function getCreditMultiplier(trustScore: number): number {
  if (trustScore >= 70) return 1.0;
  if (trustScore >= 50) return 0.5;
  return 0.25;
}

/**
 * Apply credit multiplier based on trust score.
 * Returns the adjusted credits and the multiplier used.
 */
export function applyTrustScoreToCredits(
  baseCredits: number,
  trustScore: number
): { adjustedCredits: number; multiplier: number } {
  const multiplier = getCreditMultiplier(trustScore);
  const adjustedCredits = Math.round(baseCredits * multiplier);
  return { adjustedCredits, multiplier };
}
