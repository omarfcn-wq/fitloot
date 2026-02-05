 import { Dumbbell, Gamepad2 } from "lucide-react";
 
 interface LogoProps {
   size?: "sm" | "md" | "lg";
   showText?: boolean;
 }
 
 export function Logo({ size = "md", showText = true }: LogoProps) {
   const sizes = {
     sm: { icon: 20, text: "text-lg" },
     md: { icon: 28, text: "text-2xl" },
     lg: { icon: 40, text: "text-4xl" },
   };
 
   return (
     <div className="flex items-center gap-2">
       <div className="relative">
         <Dumbbell 
           size={sizes[size].icon} 
           className="text-primary animate-glow-pulse" 
         />
         <Gamepad2 
           size={sizes[size].icon * 0.6} 
           className="absolute -bottom-1 -right-1 text-secondary" 
         />
       </div>
       {showText && (
         <span className={`font-bold ${sizes[size].text} text-glow-green`}>
           <span className="text-primary">Fit</span>
           <span className="text-secondary">Loot</span>
         </span>
       )}
     </div>
   );
 }