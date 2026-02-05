 import { Navbar } from "@/components/Navbar";
 import { RewardCard } from "@/components/RewardCard";
 import { useRewards } from "@/hooks/useRewards";
 import { useAuth } from "@/hooks/useAuth";
 import { Loader2, Gift } from "lucide-react";
 import { toast } from "sonner";
 import { Link } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 
 export default function Rewards() {
   const { user } = useAuth();
   const { rewards, isLoading, redeemReward, isRedeeming, canAfford } = useRewards();
 
   const handleRedeem = (reward: typeof rewards[0]) => {
     if (!user) {
       toast.error("Debes iniciar sesión para canjear recompensas");
       return;
     }
     
     redeemReward(reward, {
       onSuccess: () => {
         toast.success(`¡Has canjeado "${reward.name}"!`);
       },
       onError: (error) => {
         toast.error(error.message || "Error al canjear recompensa");
       },
     });
   };
 
   return (
     <div className="min-h-screen bg-background">
       <Navbar />
       
       <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
         <div className="mb-8">
           <h1 className="text-3xl font-bold text-foreground">Catálogo de Recompensas</h1>
           <p className="text-muted-foreground">
             Canjea tus créditos por recompensas exclusivas
           </p>
         </div>
         
         {!user && (
           <div className="mb-8 p-4 rounded-xl bg-muted border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
             <p className="text-muted-foreground">
               Inicia sesión para canjear recompensas
             </p>
             <Link to="/auth">
               <Button className="glow-green">Iniciar Sesión</Button>
             </Link>
           </div>
         )}
         
         {isLoading ? (
           <div className="flex justify-center py-16">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
           </div>
         ) : rewards.length === 0 ? (
           <div className="text-center py-16">
             <Gift className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
             <p className="text-xl text-muted-foreground">
               No hay recompensas disponibles
             </p>
           </div>
         ) : (
           <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {rewards.map((reward) => (
               <RewardCard
                 key={reward.id}
                 reward={reward}
                 canAfford={user ? canAfford(reward.credits_cost) : false}
                 onRedeem={() => handleRedeem(reward)}
                 isRedeeming={isRedeeming}
               />
             ))}
           </div>
         )}
       </main>
     </div>
   );
 }