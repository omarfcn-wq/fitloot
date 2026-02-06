import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { getTrustScoreDisplay } from "@/lib/trust-score";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TrustScoreBadgeProps {
  score: number;
  flags?: string[];
  showScore?: boolean;
  size?: "sm" | "md";
}

const iconMap = {
  "shield-check": ShieldCheck,
  "shield": Shield,
  "shield-alert": ShieldAlert,
  "shield-x": ShieldX,
};

export function TrustScoreBadge({ 
  score, 
  flags = [], 
  showScore = false,
  size = "sm" 
}: TrustScoreBadgeProps) {
  const display = getTrustScoreDisplay(score);
  const Icon = iconMap[display.icon];
  
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const badgeSize = size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "inline-flex items-center gap-1 rounded-full font-medium",
              display.bgColor,
              display.color,
              badgeSize
            )}
          >
            <Icon className={iconSize} />
            {showScore && <span>{score}%</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">
              {display.label} ({score}%)
            </p>
            {flags.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {flags.slice(0, 3).map((flag, i) => (
                  <li key={i}>• {formatFlag(flag)}</li>
                ))}
                {flags.length > 3 && (
                  <li className="text-muted-foreground/70">
                    +{flags.length - 3} más
                  </li>
                )}
              </ul>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function formatFlag(flag: string): string {
  const explanations: Record<string, string> = {
    manual_no_biometrics: "Sin datos biométricos",
    manual_with_biometrics: "Manual con biométricos",
    duration_too_short: "Duración muy corta",
    duration_exceeds_limit: "Duración excesiva",
    duration_near_limit: "Duración cerca del límite",
    hr_too_low_for_activity: "FC muy baja",
    hr_below_expected: "FC por debajo esperada",
    hr_abnormally_high: "FC anormalmente alta",
    hr_no_variance_suspicious: "Patrón mecánico detectado",
    hr_variance_too_low: "Variación FC muy baja",
    wearable_missing_hr: "Dispositivo sin FC",
    calories_too_low: "Calorías muy bajas",
    calories_unrealistic: "Calorías irreales",
    hr_calorie_mismatch: "Discrepancia FC/Calorías",
  };
  
  return explanations[flag] ?? flag.replace(/_/g, " ");
}
