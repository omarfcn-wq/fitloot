import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { TrainerCard } from "@/components/TrainerCard";
import { RoutineCard } from "@/components/RoutineCard";
import { useAuth } from "@/hooks/useAuth";
import { useRoutines } from "@/hooks/useRoutines";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Dumbbell, Users, X } from "lucide-react";

const categoryFilters = [
  { value: "all", label: "Todas" },
  { value: "calistenia", label: "Calistenia" },
  { value: "funcional", label: "Funcional" },
  { value: "hiit", label: "HIIT" },
  { value: "strength", label: "Fuerza" },
  { value: "flexibility", label: "Flexibilidad" },
];

const difficultyFilters = [
  { value: "all", label: "Todos" },
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
];

export default function Routines() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    trainers,
    routines,
    trainersLoading,
    routinesLoading,
    completeRoutine,
    getRoutinesByTrainer,
    getCompletionCount,
  } = useRoutines();

  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  if (authLoading || trainersLoading || routinesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredRoutines = routines.filter((r) => {
    if (selectedTrainer && r.trainer_id !== selectedTrainer) return false;
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    if (difficultyFilter !== "all" && r.difficulty !== difficultyFilter) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Rutinas de Entrenamiento</h1>
              <p className="text-muted-foreground">
                Planes creados por entrenadores profesionales de todo el mundo
              </p>
            </div>
          </div>
        </div>

        {/* Trainers Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">Entrenadores Partner</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainers.map((trainer) => (
              <TrainerCard
                key={trainer.id}
                trainer={trainer}
                routineCount={getRoutinesByTrainer(trainer.id).length}
                selected={selectedTrainer === trainer.id}
                onClick={() =>
                  setSelectedTrainer(selectedTrainer === trainer.id ? null : trainer.id)
                }
              />
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {categoryFilters.map((f) => (
              <Badge
                key={f.value}
                variant={categoryFilter === f.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setCategoryFilter(f.value)}
              >
                {f.label}
              </Badge>
            ))}
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-wrap gap-2">
            {difficultyFilters.map((f) => (
              <Badge
                key={f.value}
                variant={difficultyFilter === f.value ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setDifficultyFilter(f.value)}
              >
                {f.label}
              </Badge>
            ))}
          </div>
          {(selectedTrainer || categoryFilter !== "all" || difficultyFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-muted-foreground"
              onClick={() => {
                setSelectedTrainer(null);
                setCategoryFilter("all");
                setDifficultyFilter("all");
              }}
            >
              <X className="h-3 w-3" />
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Routines Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoutines.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No se encontraron rutinas con estos filtros.</p>
            </div>
          ) : (
            filteredRoutines.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                completionCount={getCompletionCount(routine.id)}
                onComplete={() =>
                  completeRoutine.mutate({
                    routineId: routine.id,
                    durationMinutes: routine.duration_minutes,
                    category: routine.category,
                  })
                }
                isCompleting={completeRoutine.isPending}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
