import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { Trainer } from "@/hooks/useRoutines";

interface TrainerCardProps {
  trainer: Trainer;
  routineCount: number;
  selected?: boolean;
  onClick: () => void;
}

const specialtyLabels: Record<string, string> = {
  calistenia: "Calistenia",
  funcional: "Funcional",
  hiit: "HIIT",
  strength: "Fuerza",
  flexibility: "Flexibilidad",
  general: "General",
};

export function TrainerCard({ trainer, routineCount, selected, onClick }: TrainerCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
        selected
          ? "ring-2 ring-primary border-primary bg-primary/5"
          : "bg-card border-border hover:border-primary/50"
      }`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            <img
              src={trainer.avatar_url || "/placeholder.svg"}
              alt={trainer.name}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
            />
            <span className="absolute -bottom-1 -right-1 text-lg">{trainer.country_flag}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-foreground truncate">{trainer.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{trainer.country}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {specialtyLabels[trainer.specialty] || trainer.specialty}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {routineCount} rutinas
              </Badge>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{trainer.bio}</p>
        {trainer.social_url && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 gap-1 text-xs text-primary"
            onClick={(e) => {
              e.stopPropagation();
              window.open(trainer.social_url!, "_blank");
            }}
          >
            <ExternalLink className="h-3 w-3" />
            Canal
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
