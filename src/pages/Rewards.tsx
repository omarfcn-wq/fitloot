import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { RewardCard } from "@/components/RewardCard";
import { useRewards } from "@/hooks/useRewards";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Gift, Filter } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const CATEGORIES = [
  { value: "all", label: "Todos" },
  { value: "membership", label: "Membresías" },
  { value: "products", label: "Productos" },
  { value: "classes", label: "Clases" },
  { value: "skin", label: "Skins" },
  { value: "pass", label: "Pases" },
  { value: "game", label: "Juegos" },
];

export default function Rewards() {
  const { user } = useAuth();
  const { rewards, isLoading, redeemReward, isRedeeming, canAfford } = useRewards();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredRewards = selectedCategory === "all" 
    ? rewards 
    : rewards.filter(r => r.category === selectedCategory);

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

        {/* Category Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtrar por categoría</span>
          </div>
          <ToggleGroup 
            type="single" 
            value={selectedCategory} 
            onValueChange={(value) => value && setSelectedCategory(value)}
            className="flex flex-wrap justify-start gap-2"
          >
            {CATEGORIES.map((cat) => (
              <ToggleGroupItem 
                key={cat.value} 
                value={cat.value}
                className="px-4 py-2 rounded-full border border-border bg-card data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary transition-colors"
              >
                {cat.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="text-center py-16">
            <Gift className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-xl text-muted-foreground">
              {selectedCategory === "all" 
                ? "No hay recompensas disponibles" 
                : "No hay recompensas en esta categoría"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.map((reward) => (
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