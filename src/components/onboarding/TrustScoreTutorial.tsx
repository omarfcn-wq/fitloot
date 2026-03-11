import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TutorialStep } from "./TutorialStep";
import {
  ShieldCheck,
  Coins,
  Watch,
  Zap,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustScoreTutorialProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STEPS = [
  {
    id: "welcome",
    icon: <ShieldCheck className="h-10 w-10" />,
    title: "¿Qué es el Trust Score?",
    description:
      "El Trust Score es un indicador de confianza que mide la veracidad de tus actividades físicas. Cuanto más alto sea tu score, más créditos ganarás por cada minuto de ejercicio.",
  },
  {
    id: "multipliers",
    icon: <Coins className="h-10 w-10" />,
    title: "Cómo afecta tus créditos",
    description:
      "Tu Trust Score determina el multiplicador aplicado a tus créditos base. Un score alto significa que recibes el 100% de tus créditos.",
  },
  {
    id: "wearables",
    icon: <Watch className="h-10 w-10" />,
    title: "Conecta tu Wearable",
    description:
      "Conectar dispositivos como Fitbit o Google Fit aumenta automáticamente tu Trust Score al verificar tus actividades con datos biométricos reales.",
  },
  {
    id: "benefits",
    icon: <Zap className="h-10 w-10" />,
    title: "¡Maximiza tus ganancias!",
    description:
      "Con un wearable conectado, tus actividades se verifican automáticamente, obteniendo el multiplicador máximo y más créditos por tu esfuerzo.",
  },
];

export function TrustScoreTutorial({
  open,
  onClose,
  onComplete,
}: TrustScoreTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleConnectWearable = () => {
    onComplete();
    navigate("/settings");
  };

  const step = STEPS[currentStep];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[calc(100%-1rem)] sm:max-w-lg max-h-[90vh] p-0 gap-0 overflow-y-auto bg-card border-border rounded-lg">
        {/* Header */}
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Tutorial: Trust Score
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progress} className="mt-4 h-1" />
        </DialogHeader>

        {/* Content */}
        <div className="p-6 min-h-[260px] sm:min-h-[340px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <TutorialStep
                icon={step.icon}
                title={step.title}
                description={step.description}
              >
                {/* Step-specific content */}
                {step.id === "multipliers" && <MultipliersContent />}
                {step.id === "wearables" && <WearablesContent />}
                {step.id === "benefits" && <BenefitsContent />}
              </TutorialStep>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={isFirstStep}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <div className="flex items-center gap-1.5">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  idx === currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          {isLastStep ? (
            <Button onClick={handleConnectWearable} className="gap-1">
              <Watch className="h-4 w-4" />
              Conectar
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-1">
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MultipliersContent() {
  const tiers = [
    { range: "70-100", multiplier: "1.0x", credits: "100%", color: "text-emerald-400", bg: "bg-emerald-500/20" },
    { range: "50-69", multiplier: "0.5x", credits: "50%", color: "text-yellow-400", bg: "bg-yellow-500/20" },
    { range: "0-49", multiplier: "0.25x", credits: "25%", color: "text-red-400", bg: "bg-red-500/20" },
  ];

  return (
    <div className="grid gap-2 mt-4 w-full max-w-xs mx-auto">
      {tiers.map((tier) => (
        <motion.div
          key={tier.range}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "flex items-center justify-between p-3 rounded-lg border border-border",
            tier.bg
          )}
        >
          <span className="text-sm text-muted-foreground">Score {tier.range}</span>
          <div className="flex items-center gap-2">
            <span className={cn("font-mono font-bold", tier.color)}>
              {tier.multiplier}
            </span>
            <span className="text-xs text-muted-foreground">({tier.credits})</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function WearablesContent() {
  const sources = [
    { name: "Manual", score: "~50", icon: <AlertTriangle className="h-4 w-4" />, color: "text-yellow-400" },
    { name: "Wearable", score: "~85+", icon: <CheckCircle2 className="h-4 w-4" />, color: "text-emerald-400" },
  ];

  return (
    <div className="flex gap-4 mt-4 justify-center">
      {sources.map((source) => (
        <motion.div
          key={source.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-muted/30 min-w-[100px]"
        >
          <div className={source.color}>{source.icon}</div>
          <span className="text-sm font-medium text-foreground">{source.name}</span>
          <span className={cn("text-lg font-bold", source.color)}>{source.score}</span>
        </motion.div>
      ))}
    </div>
  );
}

function BenefitsContent() {
  const benefits = [
    "Verificación automática",
    "Multiplicador máximo (1.0x)",
    "Datos biométricos reales",
    "Más créditos por actividad",
  ];

  return (
    <div className="grid grid-cols-2 gap-2 mt-4 w-full max-w-sm mx-auto">
      {benefits.map((benefit, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary text-sm"
        >
          <TrendingUp className="h-3 w-3 shrink-0" />
          <span>{benefit}</span>
        </motion.div>
      ))}
    </div>
  );
}

