import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";
import { useI18n } from "@/i18n";

interface LevelBadgeProps {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  compact?: boolean;
}

export function LevelBadge({ level, currentXP, nextLevelXP, compact = false }: LevelBadgeProps) {
  const progress = (currentXP / nextLevelXP) * 100;
  const { t } = useI18n();

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/20 border border-primary/30">
        <Star className="h-3.5 w-3.5 text-primary fill-primary" />
        <span className="text-sm font-bold text-primary">{t("level_short")} {level}</span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Star className="h-5 w-5 text-primary fill-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("level_label")}</p>
            <p className="text-2xl font-bold text-foreground">{level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">{t("level_xp")}</p>
          <p className="text-lg font-semibold text-foreground">
            {currentXP} / {nextLevelXP}
          </p>
        </div>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-muted-foreground mt-2 text-center">
        {t("level_next", { xp: nextLevelXP - currentXP })}
      </p>
    </div>
  );
}
