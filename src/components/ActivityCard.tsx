import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bike, 
  Footprints, 
  Dumbbell, 
  Waves, 
  Mountain,
  Timer,
  Coins,
  Heart
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { Activity } from "@/lib/supabase-types";
import { TrustScoreBadge } from "./TrustScoreBadge";

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

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const Icon = activityIcons[activity.activity_type] ?? Dumbbell;
  
  // Parse trust_flags from the activity (it's stored as text[] in DB)
  const trustFlags = activity.trust_flags ?? [];
  const trustScore = activity.trust_score ?? 100;

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">
              {activityNames[activity.activity_type] ?? activity.activity_type}
            </p>
            <TrustScoreBadge score={trustScore} flags={trustFlags} />
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
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
              {formatDistanceToNow(new Date(activity.completed_at), { 
                addSuffix: true,
                locale: es 
              })}
            </span>
          </div>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0">
          <Coins className="h-3 w-3 mr-1" />
          +{activity.credits_earned}
        </Badge>
      </CardContent>
    </Card>
  );
}