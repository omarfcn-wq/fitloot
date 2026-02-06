import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActivities } from "@/hooks/useActivities";
import { Plus, Bike, Footprints, Dumbbell, Waves, Mountain } from "lucide-react";
import { toast } from "sonner";

const activities = [
  { value: "running", label: "Correr", icon: Footprints },
  { value: "cycling", label: "Ciclismo", icon: Bike },
  { value: "gym", label: "Gimnasio", icon: Dumbbell },
  { value: "swimming", label: "Natación", icon: Waves },
  { value: "hiking", label: "Senderismo", icon: Mountain },
];

export function LogActivityDialog() {
  const [open, setOpen] = useState(false);
  const [activityType, setActivityType] = useState("");
  const [duration, setDuration] = useState("");
  const { logActivity, isLogging } = useActivities();

  const handleSubmit = () => {
    if (!activityType || !duration) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    const durationMinutes = parseInt(duration);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      toast.error("La duración debe ser mayor a 0");
      return;
    }

    logActivity(
      { activityType, durationMinutes },
      {
        onSuccess: (result) => {
          const { creditsEarned, baseCredits, multiplier, trustScore } = result;

          if (multiplier < 1) {
            const penaltyPercent = Math.round((1 - multiplier) * 100);
            toast.warning(
              `Ganaste ${creditsEarned} créditos (base ${baseCredits}, ${multiplier}x, -${penaltyPercent}% por Trust Score ${trustScore})`,
              { duration: 5000 }
            );
          } else {
            toast.success(`¡Ganaste ${creditsEarned} créditos!`);
          }

          setOpen(false);
          setActivityType("");
          setDuration("");
        },
        onError: () => {
          toast.error("Error al registrar la actividad");
        },
      }
    );
  };

  const durationMinutes = parseInt(duration);
  const baseCreditsPreview = !isNaN(durationMinutes) && durationMinutes > 0 ? durationMinutes * 2 : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="glow-green gap-2">
          <Plus className="h-4 w-4" />
          Registrar Actividad
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Actividad Física</DialogTitle>
          <DialogDescription>Gana 2 créditos por cada minuto de ejercicio</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="activity">Tipo de actividad</Label>
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una actividad" />
              </SelectTrigger>
              <SelectContent>
                {activities.map((activity) => (
                  <SelectItem key={activity.value} value={activity.value}>
                    <div className="flex items-center gap-2">
                      <activity.icon className="h-4 w-4" />
                      {activity.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="duration">Duración (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              placeholder="30"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {baseCreditsPreview > 0 && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  Créditos base:{" "}
                  <span className="font-bold text-primary">{baseCreditsPreview} créditos</span>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-accent/50 border border-accent">
                <p className="text-xs text-muted-foreground">
                  Multiplicador por confianza:{" "}
                  <span className="font-medium text-accent-foreground">1.0x</span> (≥70),{" "}
                  <span className="font-medium text-accent-foreground">0.5x</span> (50–69),{" "}
                  <span className="font-medium text-accent-foreground">0.25x</span> (&lt;50). Conecta un
                  wearable para mejorar tu Trust Score.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLogging} className="glow-green">
            {isLogging ? "Registrando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
