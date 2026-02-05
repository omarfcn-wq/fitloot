 import { Card, CardContent, CardFooter } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Coins, Gift, Gamepad2, Palette, Ticket } from "lucide-react";
 import type { Reward } from "@/lib/supabase-types";
 
 const categoryIcons: Record<string, React.ElementType> = {
   skin: Palette,
   pass: Ticket,
   game: Gamepad2,
   accessory: Gift,
   general: Gift,
 };
 
 const categoryColors: Record<string, string> = {
   skin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
   pass: "bg-amber-500/20 text-amber-400 border-amber-500/30",
   game: "bg-blue-500/20 text-blue-400 border-blue-500/30",
   accessory: "bg-pink-500/20 text-pink-400 border-pink-500/30",
   general: "bg-gray-500/20 text-gray-400 border-gray-500/30",
 };
 
 interface RewardCardProps {
   reward: Reward;
   canAfford: boolean;
   onRedeem: () => void;
   isRedeeming?: boolean;
 }
 
 export function RewardCard({ reward, canAfford, onRedeem, isRedeeming }: RewardCardProps) {
   const Icon = categoryIcons[reward.category] ?? Gift;
 
   return (
     <Card className={`bg-card border-border overflow-hidden transition-all hover:scale-[1.02] ${
       canAfford ? "hover:border-primary/50 hover:glow-green" : "opacity-60"
     }`}>
       <div className="h-32 bg-gradient-to-br from-muted to-card flex items-center justify-center">
         <Icon className="h-16 w-16 text-muted-foreground/30" />
       </div>
       <CardContent className="p-4">
         <Badge className={categoryColors[reward.category] ?? categoryColors.general}>
           {reward.category}
         </Badge>
         <h3 className="font-bold text-lg mt-2 text-foreground">{reward.name}</h3>
         <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
           {reward.description}
         </p>
       </CardContent>
       <CardFooter className="p-4 pt-0 flex items-center justify-between">
         <div className="flex items-center gap-1 text-primary font-bold">
           <Coins className="h-4 w-4" />
           {reward.credits_cost.toLocaleString()}
         </div>
         <Button 
           size="sm" 
           disabled={!canAfford || isRedeeming}
           onClick={onRedeem}
           className={canAfford ? "glow-green" : ""}
         >
           {isRedeeming ? "Canjeando..." : "Canjear"}
         </Button>
       </CardFooter>
     </Card>
   );
 }