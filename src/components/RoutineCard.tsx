import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Dumbbell, Flame, ChevronDown, ChevronUp, CheckCircle2, Play } from "lucide-react";
import type { Routine } from "@/hooks/useRoutines";

interface RoutineCardProps {
  routine: Routine;
  completionCount: number;
  onComplete: () => void;
  isCompleting: boolean;
}

const difficultyConfig: Record<string, { label: string; color: string }> = {
  beginner: { label: "Principiante", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  intermediate: { label: "Intermedio", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  advanced: { label: "Avanzado", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const categoryLabels: Record<string, string> = {
  calistenia: "Calistenia",
  funcional: "Funcional",
  hiit: "HIIT",
  strength: "Fuerza",
  flexibility: "Flexibilidad",
  cardio: "Cardio",
};

export function RoutineCard({ routine, completionCount, onComplete, isCompleting }: RoutineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const diff = difficultyConfig[routine.difficulty] || difficultyConfig.intermediate;

  return (
    <Card className="bg-card border-border hover:border-primary/30 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg text-foreground">{routine.title}</CardTitle>
            {routine.trainer && (
              <p className="text-xs text-muted-foreground mt-1">
                {routine.trainer.country_flag} {routine.trainer.name}
              </p>
            )}
          </div>
          {completionCount > 0 && (
            <div className="flex items-center gap-1 text-primary">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">{completionCount}x</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{routine.description}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className={diff.color}>
            <Flame className="h-3 w-3 mr-1" />
            {diff.label}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {routine.duration_minutes} min
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            <Dumbbell className="h-3 w-3 mr-1" />
            {categoryLabels[routine.category] || routine.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-sm">{routine.exercises.length} ejercicios</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {routine.exercises.map((ex, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary w-5">{i + 1}</span>
                  <span className="text-foreground">{ex.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{ex.reps}</span>
                  {ex.rest && <span>⏱ {ex.rest}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            className="flex-1 gap-2"
            onClick={onComplete}
            disabled={isCompleting}
          >
            <Play className="h-4 w-4" />
            {isCompleting ? "Registrando..." : "Completar rutina"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
