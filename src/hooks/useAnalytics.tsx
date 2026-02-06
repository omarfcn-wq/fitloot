import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TrustScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface TrustScoreBySource {
  source: string;
  avgScore: number;
  count: number;
}

export interface TrustScoreByActivity {
  activityType: string;
  avgScore: number;
  count: number;
}

export interface TrustFlagFrequency {
  flag: string;
  count: number;
  label: string;
}

export interface PenaltyMetrics {
  penalizedActivities: number;
  nonPenalizedActivities: number;
  penaltyPercentage: number;
  totalBaseCredits: number;
  totalAdjustedCredits: number;
  creditsLost: number;
  byMultiplier: {
    multiplier: string;
    count: number;
    creditsLost: number;
  }[];
}

export interface AnalyticsData {
  totalActivities: number;
  avgTrustScore: number;
  verifiedActivities: number;
  flaggedActivities: number;
  suspiciousActivities: number;
  distribution: TrustScoreDistribution[];
  bySource: TrustScoreBySource[];
  byActivity: TrustScoreByActivity[];
  flagFrequency: TrustFlagFrequency[];
  recentTrend: { date: string; avgScore: number; count: number }[];
  penaltyMetrics: PenaltyMetrics;
}

const FLAG_LABELS: Record<string, string> = {
  no_biometric_data: "Sin datos biométricos",
  duration_too_short: "Duración muy corta",
  duration_too_long: "Duración excesiva",
  low_heart_rate: "Frecuencia cardíaca baja",
  high_heart_rate: "Frecuencia cardíaca alta",
  mechanical_heart_rate: "Patrón mecánico de HR",
  calorie_mismatch: "Calorías inconsistentes",
  manual_entry: "Entrada manual",
  wearable_verified: "Verificado por wearable",
};

export function useAnalytics() {
  const { user } = useAuth();

  // Check if current user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin-analytics", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["trust-analytics"],
    queryFn: async (): Promise<AnalyticsData> => {
      // Fetch all activities for analytics
      const { data: activities, error } = await supabase
        .from("activities")
        .select("activity_type, trust_score, trust_flags, source, completed_at, credits_earned, duration_minutes")
        .order("completed_at", { ascending: false });

      if (error) throw error;

      const allActivities = activities || [];
      const totalActivities = allActivities.length;

      if (totalActivities === 0) {
        return {
          totalActivities: 0,
          avgTrustScore: 0,
          verifiedActivities: 0,
          flaggedActivities: 0,
          suspiciousActivities: 0,
          distribution: [],
          bySource: [],
          byActivity: [],
          flagFrequency: [],
          recentTrend: [],
          penaltyMetrics: {
            penalizedActivities: 0,
            nonPenalizedActivities: 0,
            penaltyPercentage: 0,
            totalBaseCredits: 0,
            totalAdjustedCredits: 0,
            creditsLost: 0,
            byMultiplier: [],
          },
        };
      }

      // Calculate average trust score
      const avgTrustScore = Math.round(
        allActivities.reduce((sum, a) => sum + (a.trust_score ?? 100), 0) / totalActivities
      );

      // Count by trust level
      const verifiedActivities = allActivities.filter((a) => (a.trust_score ?? 100) >= 90).length;
      const flaggedActivities = allActivities.filter((a) => (a.trust_score ?? 100) < 50).length;
      const suspiciousActivities = allActivities.filter(
        (a) => (a.trust_score ?? 100) >= 50 && (a.trust_score ?? 100) < 70
      ).length;

      // Distribution by score range
      const ranges = [
        { range: "90-100", min: 90, max: 100 },
        { range: "70-89", min: 70, max: 89 },
        { range: "50-69", min: 50, max: 69 },
        { range: "0-49", min: 0, max: 49 },
      ];

      const distribution: TrustScoreDistribution[] = ranges.map(({ range, min, max }) => {
        const count = allActivities.filter((a) => {
          const score = a.trust_score ?? 100;
          return score >= min && score <= max;
        }).length;
        return {
          range,
          count,
          percentage: Math.round((count / totalActivities) * 100),
        };
      });

      // By source
      const sourceMap = new Map<string, { total: number; count: number }>();
      allActivities.forEach((a) => {
        const source = a.source || "unknown";
        const current = sourceMap.get(source) || { total: 0, count: 0 };
        sourceMap.set(source, {
          total: current.total + (a.trust_score ?? 100),
          count: current.count + 1,
        });
      });

      const bySource: TrustScoreBySource[] = Array.from(sourceMap.entries()).map(
        ([source, { total, count }]) => ({
          source: source === "wearable" ? "Wearable" : source === "manual" ? "Manual" : source,
          avgScore: Math.round(total / count),
          count,
        })
      );

      // By activity type
      const activityMap = new Map<string, { total: number; count: number }>();
      allActivities.forEach((a) => {
        const type = a.activity_type;
        const current = activityMap.get(type) || { total: 0, count: 0 };
        activityMap.set(type, {
          total: current.total + (a.trust_score ?? 100),
          count: current.count + 1,
        });
      });

      const byActivity: TrustScoreByActivity[] = Array.from(activityMap.entries())
        .map(([activityType, { total, count }]) => ({
          activityType,
          avgScore: Math.round(total / count),
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Flag frequency
      const flagCount = new Map<string, number>();
      allActivities.forEach((a) => {
        const flags = a.trust_flags || [];
        flags.forEach((flag) => {
          flagCount.set(flag, (flagCount.get(flag) || 0) + 1);
        });
      });

      const flagFrequency: TrustFlagFrequency[] = Array.from(flagCount.entries())
        .map(([flag, count]) => ({
          flag,
          count,
          label: FLAG_LABELS[flag] || flag,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Recent trend (last 7 days)
      const now = new Date();
      const recentTrend: { date: string; avgScore: number; count: number }[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const dayActivities = allActivities.filter((a) =>
          a.completed_at.startsWith(dateStr)
        );

        if (dayActivities.length > 0) {
          const dayAvg = Math.round(
            dayActivities.reduce((sum, a) => sum + (a.trust_score ?? 100), 0) /
              dayActivities.length
          );
          recentTrend.push({
            date: new Date(dateStr).toLocaleDateString("es-ES", { weekday: "short" }),
            avgScore: dayAvg,
            count: dayActivities.length,
          });
        } else {
          recentTrend.push({
            date: new Date(dateStr).toLocaleDateString("es-ES", { weekday: "short" }),
            avgScore: 0,
            count: 0,
          });
        }
      }

      // Penalty metrics calculation
      const CREDITS_PER_MINUTE = 2;
      let totalBaseCredits = 0;
      let totalAdjustedCredits = 0;
      const multiplierCounts: Record<string, { count: number; creditsLost: number }> = {
        "0.5": { count: 0, creditsLost: 0 },
        "0.25": { count: 0, creditsLost: 0 },
      };

      allActivities.forEach((a) => {
        const baseCredits = a.duration_minutes * CREDITS_PER_MINUTE;
        const adjustedCredits = a.credits_earned;
        totalBaseCredits += baseCredits;
        totalAdjustedCredits += adjustedCredits;

        if (adjustedCredits < baseCredits) {
          const ratio = adjustedCredits / baseCredits;
          if (ratio <= 0.3) {
            multiplierCounts["0.25"].count++;
            multiplierCounts["0.25"].creditsLost += baseCredits - adjustedCredits;
          } else {
            multiplierCounts["0.5"].count++;
            multiplierCounts["0.5"].creditsLost += baseCredits - adjustedCredits;
          }
        }
      });

      const penalizedActivities = multiplierCounts["0.5"].count + multiplierCounts["0.25"].count;
      const penaltyMetrics: PenaltyMetrics = {
        penalizedActivities,
        nonPenalizedActivities: totalActivities - penalizedActivities,
        penaltyPercentage: Math.round((penalizedActivities / totalActivities) * 100),
        totalBaseCredits,
        totalAdjustedCredits,
        creditsLost: totalBaseCredits - totalAdjustedCredits,
        byMultiplier: [
          { multiplier: "0.5", ...multiplierCounts["0.5"] },
          { multiplier: "0.25", ...multiplierCounts["0.25"] },
        ].filter((m) => m.count > 0),
      };

      return {
        totalActivities,
        avgTrustScore,
        verifiedActivities,
        flaggedActivities,
        suspiciousActivities,
        distribution,
        bySource,
        byActivity,
        flagFrequency,
        recentTrend,
        penaltyMetrics,
      };
    },
    enabled: isAdmin === true,
  });

  return {
    analytics,
    isLoading,
    isAdmin: isAdmin ?? false,
  };
}
