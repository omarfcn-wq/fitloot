import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { RewardCard } from "@/components/RewardCard";
import { useRewards } from "@/hooks/useRewards";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { Loader2, Gift, Filter, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { TranslationKeys } from "@/i18n/es";

const CATEGORIES: { value: string; labelKey: TranslationKeys }[] = [
  { value: "all", labelKey: "rewards_cat_all" },
  { value: "membership", labelKey: "rewards_cat_membership" },
  { value: "products", labelKey: "rewards_cat_products" },
  { value: "classes", labelKey: "rewards_cat_classes" },
  { value: "skin", labelKey: "rewards_cat_skin" },
  { value: "pass", labelKey: "rewards_cat_pass" },
  { value: "game", labelKey: "rewards_cat_game" },
];

export default function Rewards() {
  const { user } = useAuth();
  const { rewards, isLoading, redeemReward, isRedeeming, canAfford } = useRewards();
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 50);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery]);

  const filteredRewards = rewards.filter((r) => {
    const matchesCategory = selectedCategory === "all" || r.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRedeem = (reward: typeof rewards[0]) => {
    if (!user) {
      toast.error(t("rewards_login_required"));
      return;
    }
    
    redeemReward(reward, {
      onSuccess: () => {
        toast.success(t("rewards_redeem_success", { name: reward.name }));
      },
      onError: (error) => {
        toast.error(error.message || t("rewards_redeem_error"));
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t("rewards_title")}</h1>
          <p className="text-muted-foreground">{t("rewards_subtitle")}</p>
        </div>
        
        {!user && (
          <div className="mb-8 p-4 rounded-xl bg-muted border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground">{t("rewards_login_prompt")}</p>
            <Link to="/auth">
              <Button className="glow-green">{t("sign_in")}</Button>
            </Link>
          </div>
        )}

        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("rewards_search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-card border-border"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t("filter_by_category")}</span>
          </div>
          <ToggleGroup 
            type="single" 
            value={selectedCategory} 
            onValueChange={(value) => value && setSelectedCategory(value)}
            className="flex flex-wrap justify-start gap-2"
          >
            {CATEGORIES.map((cat) => {
              const count = cat.value === "all" 
                ? rewards.length 
                : rewards.filter(r => r.category === cat.value).length;
              return (
                <ToggleGroupItem 
                  key={cat.value} 
                  value={cat.value}
                  className="px-4 py-2 rounded-full border border-border bg-card data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary transition-colors"
                >
                  {t(cat.labelKey)}
                  <span className="ml-1.5 text-xs opacity-70">({count})</span>
                </ToggleGroupItem>
              );
            })}
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
              {searchQuery 
                ? t("rewards_no_results", { query: searchQuery })
                : selectedCategory === "all" 
                  ? t("rewards_no_available")
                  : t("rewards_no_category")}
            </p>
            {searchQuery && (
              <Button 
                variant="link" 
                onClick={() => setSearchQuery("")}
                className="mt-2"
              >
                {t("clear_search")}
              </Button>
            )}
          </div>
        ) : (
          <>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mb-4">
                {t("results_for", { count: filteredRewards.length, query: searchQuery })}
              </p>
            )}
            <div 
              className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-300 ${
                isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              }`}
            >
              {filteredRewards.map((reward, index) => (
                <div 
                  key={reward.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                >
                  <RewardCard
                    reward={reward}
                    canAfford={user ? canAfford(reward.credits_cost) : false}
                    onRedeem={() => handleRedeem(reward)}
                    isRedeeming={isRedeeming}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
