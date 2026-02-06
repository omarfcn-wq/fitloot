import { useState, useMemo } from "react";
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
import { Plus, Bike, Footprints, Dumbbell, Waves, Mountain, ShieldAlert, ShieldCheck, Shield, ShieldX, Info } from "lucide-react";
import { toast } from "sonner";
import { calculateTrustScore, getTrustScoreDisplay, applyTrustScoreToCredits, getFlagExplanation } from "@/lib/trust-score";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const activities = [
  { value: "running", label: "Correr", icon: Footprints },
  { value: "cycling", label: "Ciclismo", icon: Bike },
  { value: "gym", label: "Gimnasio", icon: Dumbbell },
  { value: "swimming", label: "Natación", icon: Waves },
  { value: "hiking", label: "Senderismo", icon: Mountain },
];

const CREDITS_PER_MINUTE = 2;

export function LogActivityDialog() {
  const [open, setOpen] = useState(false);
  const [activityType, setActivityType] = useState("");
  const [duration, setDuration] = useState("");
  const { logActivity, isLogging } = useActivities();

  // Calculate estimated trust score in real-time
  const estimatedTrustInfo = useMemo(() => {
    const durationMinutes = parseInt(duration);
    if (!activityType || isNaN(durationMinutes) || durationMinutes <= 0) {
      return null;
    }

    const result = calculateTrustScore({
      activityType,
      durationMinutes,
      source: "manual",
    });

    const display = getTrustScoreDisplay(result.score);
    const baseCredits = durationMinutes * CREDITS_PER_MINUTE;
    const { adjustedCredits, multiplier } = applyTrustScoreToCredits(baseCredits, result.score);

    return {
      score: result.score,
      flags: result.flags,
      category: result.category,
      display,
      baseCredits,
      adjustedCredits,
      multiplier,
    };
  }, [activityType, duration]);

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

  const ShieldIcon = estimatedTrustInfo?.display.icon === "shield-check" ? ShieldCheck
    : estimatedTrustInfo?.display.icon === "shield" ? Shield
    : estimatedTrustInfo?.display.icon === "shield-alert" ? ShieldAlert
    : ShieldX;

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

          {/* Real-time Trust Score Indicator */}
          {estimatedTrustInfo && (
            <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              {/* Trust Score Display */}
              <div className={cn(
                "p-4 rounded-lg border-2 transition-all duration-300",
                estimatedTrustInfo.category === "verified" && "border-green-500/50 bg-green-500/10",
                estimatedTrustInfo.category === "trusted" && "border-blue-500/50 bg-blue-500/10",
                estimatedTrustInfo.category === "suspicious" && "border-yellow-500/50 bg-yellow-500/10",
                estimatedTrustInfo.category === "flagged" && "border-red-500/50 bg-red-500/10",
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldIcon className={cn(
                      "h-5 w-5",
                      estimatedTrustInfo.category === "verified" && "text-green-400",
                      estimatedTrustInfo.category === "trusted" && "text-blue-400",
                      estimatedTrustInfo.category === "suspicious" && "text-yellow-400",
                      estimatedTrustInfo.category === "flagged" && "text-red-400",
                    )} />
                    <span className="text-sm font-medium text-muted-foreground">Trust Score Estimado</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">Este es un estimado basado en los datos ingresados. El score final puede variar.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className={cn(
                    "text-2xl font-bold tabular-nums",
                    estimatedTrustInfo.category === "verified" && "text-green-400",
                    estimatedTrustInfo.category === "trusted" && "text-blue-400",
                    estimatedTrustInfo.category === "suspicious" && "text-yellow-400",
                    estimatedTrustInfo.category === "flagged" && "text-red-400",
                  )}>
                    {estimatedTrustInfo.score}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500 rounded-full",
                      estimatedTrustInfo.category === "verified" && "bg-gradient-to-r from-green-500 to-green-400",
                      estimatedTrustInfo.category === "trusted" && "bg-gradient-to-r from-blue-500 to-blue-400",
                      estimatedTrustInfo.category === "suspicious" && "bg-gradient-to-r from-yellow-500 to-yellow-400",
                      estimatedTrustInfo.category === "flagged" && "bg-gradient-to-r from-red-500 to-red-400",
                    )}
                    style={{ width: `${estimatedTrustInfo.score}%` }}
                  />
                </div>

                {/* Flags */}
                {estimatedTrustInfo.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {estimatedTrustInfo.flags.map((flag) => (
                      <TooltipProvider key={flag}>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              estimatedTrustInfo.category === "verified" && "bg-green-500/20 text-green-300",
                              estimatedTrustInfo.category === "trusted" && "bg-blue-500/20 text-blue-300",
                              estimatedTrustInfo.category === "suspicious" && "bg-yellow-500/20 text-yellow-300",
                              estimatedTrustInfo.category === "flagged" && "bg-red-500/20 text-red-300",
                            )}>
                              {flag.replace(/_/g, " ")}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{getFlagExplanation(flag)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                )}
              </div>

              {/* Credits Preview */}
              <div className="p-3 rounded-lg bg-card border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Créditos estimados:</span>
                  <div className="flex items-center gap-2">
                    {estimatedTrustInfo.multiplier < 1 && (
                      <span className="text-xs text-muted-foreground line-through">
                        {estimatedTrustInfo.baseCredits}
                      </span>
                    )}
                    <span className={cn(
                      "text-lg font-bold",
                      estimatedTrustInfo.multiplier < 1 ? "text-yellow-400" : "text-primary"
                    )}>
                      {estimatedTrustInfo.adjustedCredits}
                    </span>
                    {estimatedTrustInfo.multiplier < 1 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                        {estimatedTrustInfo.multiplier}x
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tip to improve */}
              {estimatedTrustInfo.multiplier < 1 && (
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>Conecta un wearable para obtener datos biométricos y mejorar tu Trust Score.</span>
                </p>
              )}
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
