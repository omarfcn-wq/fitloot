import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, Play, Calendar, Flame, Crown, Clock, Zap, 
  Coins, PiggyBank, Gem, Star, Medal, Lock
} from "lucide-react";
import type { Achievement } from "@/lib/supabase-types";

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  play: Play,
  calendar: Calendar,
  flame: Flame,
  crown: Crown,
  clock: Clock,
  zap: Zap,
  coins: Coins,
  "piggy-bank": PiggyBank,
  gem: Gem,
  star: Star,
  medal: Medal,
};

const categoryColors: Record<string, string> = {
  beginner: "bg-green-500/20 text-green-400 border-green-500/30",
  milestone: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  time: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  credits: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  streak: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  general: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

interface AchievementCardProps {
  achievement: Achievement;
  earned: boolean;
  earnedAt?: string;
  progress?: number;
}

export function AchievementCard({ achievement, earned, earnedAt, progress }: AchievementCardProps) {
  const Icon = iconMap[achievement.icon] ?? Trophy;
  const categoryColor = categoryColors[achievement.category] ?? categoryColors.general;

  return (
    <Card className={`relative overflow-hidden transition-all ${
      earned 
        ? "bg-card border-primary/50 hover:glow-green" 
        : "bg-card/50 border-border opacity-60"
    }`}>
      {!earned && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            earned ? "bg-primary/20" : "bg-muted"
          }`}>
            <Icon className={`h-6 w-6 ${earned ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={categoryColor} variant="outline">
                {achievement.category}
              </Badge>
              <span className="text-xs text-primary font-medium">
                +{achievement.xp_reward} XP
              </span>
            </div>
            <h3 className="font-semibold text-foreground truncate">{achievement.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {achievement.description}
            </p>
            {earned && earnedAt && (
              <p className="text-xs text-primary mt-1">
                Conseguido el {new Date(earnedAt).toLocaleDateString()}
              </p>
            )}
            {!earned && progress !== undefined && (
              <div className="mt-2">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary/50 transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(progress)}% completado
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
