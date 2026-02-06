import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import {
  Loader2,
  History,
  Bike,
  Footprints,
  Dumbbell,
  Waves,
  Mountain,
  Timer,
  Coins,
  Heart,
  ArrowRight,
} from "lucide-react";
import type { Activity } from "@/lib/supabase-types";
import { CREDITS_PER_MINUTE } from "@/hooks/useActivityHistory";

const activityIcons: Record<string, React.ElementType> = {
  running: Footprints,
  cycling: Bike,
  gym: Dumbbell,
  swimming: Waves,
  hiking: Mountain,
};

const activityNames: Record<string, string> = {
  running: "Correr",
  cycling: "Ciclismo",
  gym: "Gimnasio",
  swimming: "Natación",
  hiking: "Senderismo",
};

interface ActivityHistoryListProps {
  activities: Activity[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  totalDisplayed: number;
}

export function ActivityHistoryList({
  activities,
  isLoading,
  hasActiveFilters,
  totalDisplayed,
}: ActivityHistoryListProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">
          {totalDisplayed} {totalDisplayed === 1 ? "actividad" : "actividades"}
          {hasActiveFilters && " (filtradas)"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? "No hay actividades que coincidan con los filtros"
                : "No has registrado actividades aún"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => {
              const Icon = activityIcons[activity.activity_type] ?? Dumbbell;
              const baseCredits = activity.duration_minutes * CREDITS_PER_MINUTE;
              const hasPenalty = activity.credits_earned < baseCredits;
              const trustFlags = activity.trust_flags ?? [];
              const trustScore = activity.trust_score ?? 100;

              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border hover:border-primary/50 transition-all animate-in fade-in-50"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">
                        {activityNames[activity.activity_type] ?? activity.activity_type}
                      </p>
                      <TrustScoreBadge score={trustScore} flags={trustFlags} />
                      {activity.source && activity.source !== "manual" && (
                        <Badge variant="outline" className="text-xs">
                          {activity.source}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap mt-1">
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {activity.duration_minutes} min
                      </span>
                      {activity.heart_rate_avg && (
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {activity.heart_rate_avg} bpm
                        </span>
                      )}
                      <span>
                        {format(new Date(activity.completed_at), "PPp", { locale: es })}
                      </span>
                    </div>
                  </div>

                  {hasPenalty ? (
                    <Badge className="shrink-0 gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Coins className="h-3 w-3" />
                      <span className="line-through text-muted-foreground text-xs">{baseCredits}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>+{activity.credits_earned}</span>
                    </Badge>
                  ) : (
                    <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0">
                      <Coins className="h-3 w-3 mr-1" />
                      +{activity.credits_earned}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
