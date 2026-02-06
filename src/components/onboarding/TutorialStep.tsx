import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TutorialStepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
  isActive?: boolean;
}

export function TutorialStep({
  icon,
  title,
  description,
  children,
  isActive = true,
}: TutorialStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isActive ? 1 : 0.5, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center text-center space-y-4"
    >
      <div className="p-4 rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="text-muted-foreground max-w-md">{description}</p>
      {children}
    </motion.div>
  );
}
