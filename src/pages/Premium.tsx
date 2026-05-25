import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Zap, Gift, Trophy, Loader2, Check } from "lucide-react";

const PERKS = [
  { icon: Zap, title: "Multiplicador x1.5", desc: "Ganás 50% más créditos en cada actividad registrada." },
  { icon: Gift, title: "Canjes prioritarios", desc: "Tus gift cards se entregan primero, sin esperas." },
  { icon: Trophy, title: "Badge Premium", desc: "Insignia exclusiva visible en tu perfil." },
  { icon: Sparkles, title: "Acceso temprano", desc: "Probás nuevas rutinas y recompensas antes que nadie." },
];

export default function Premium() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCheckout, loading } = usePaddleCheckout();
  const { isPremium, subscription, isLoading } = useSubscription();

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    await openCheckout({
      priceId: "fitloot_premium_monthly",
      customerEmail: user.email ?? undefined,
      customData: { userId: user.id },
      successUrl: `${window.location.origin}/premium?checkout=success`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">FitLoot Premium</h1>
          <p className="text-muted-foreground">Más créditos por el mismo esfuerzo.</p>
        </div>

        <Card className="bg-card border-primary/40 shadow-lg shadow-primary/10 mb-8">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <span className="text-5xl font-bold text-foreground">$4.99</span>
              <span className="text-muted-foreground"> / mes</span>
            </div>

            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            ) : isPremium ? (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400">
                  <Check className="h-4 w-4" /> Suscripción activa
                </div>
                {subscription?.current_period_end && (
                  <p className="text-sm text-muted-foreground">
                    Renueva el {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <Button size="lg" onClick={handleSubscribe} disabled={loading} className="w-full max-w-sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Hacerme Premium
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4">
          {PERKS.map((perk) => (
            <Card key={perk.title} className="bg-card border-border">
              <CardContent className="p-5 flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <perk.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{perk.title}</h3>
                  <p className="text-sm text-muted-foreground">{perk.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Procesado por Paddle.com como Merchant of Record. Podés cancelar cuando quieras desde{" "}
          <a href="https://paddle.net" target="_blank" rel="noopener noreferrer" className="underline">paddle.net</a>.
          Garantía de devolución de 30 días — ver{" "}
          <a href="/refund" className="underline">Política de Reembolsos</a>,{" "}
          <a href="/terms" className="underline">Términos</a> y{" "}
          <a href="/privacy" className="underline">Privacidad</a>.
        </p>
      </main>
    </div>
  );
}
