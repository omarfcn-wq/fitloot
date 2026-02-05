 import { Coins } from "lucide-react";
 import { useCredits } from "@/hooks/useCredits";
 
 export function CreditDisplay() {
   const { credits, isLoading } = useCredits();
 
   return (
     <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border glow-green">
       <Coins className="h-5 w-5 text-primary" />
       <span className="font-bold text-primary text-lg">
         {isLoading ? "..." : credits.toLocaleString()}
       </span>
     </div>
   );
 }