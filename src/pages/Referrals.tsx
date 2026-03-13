import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReferrals } from "@/hooks/useReferrals";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { Copy, Check, Gift, Users, Coins, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Referrals() {
  const { user } = useAuth();
  const { t } = useI18n();
  const {
    referralCode,
    referrals,
    totalEarned,
    hasUsedReferral,
    isLoading,
    applyReferralCode,
    isApplying,
  } = useReferrals();

  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!referralCode) return;
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success(t("referrals_copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (!inputCode.trim()) return;
    applyReferralCode(inputCode.trim());
    setInputCode("");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("referrals_title")}</h1>
          <p className="text-muted-foreground">{t("referrals_subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{referrals.length}</p>
                <p className="text-sm text-muted-foreground">{t("referrals_stat_referrals")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Coins className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalEarned}</p>
                <p className="text-sm text-muted-foreground">{t("referrals_stat_credits")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Gift className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">50</p>
                <p className="text-sm text-muted-foreground">{t("referrals_stat_per_referral")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <UserPlus className="h-5 w-5 text-primary" />
                {t("referrals_your_code")}
              </CardTitle>
              <CardDescription>{t("referrals_share_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-lg text-center tracking-widest text-foreground select-all">
                    {referralCode}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 shrink-0"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Gift className="h-5 w-5 text-secondary" />
                {t("referrals_use_code")}
              </CardTitle>
              <CardDescription>
                {hasUsedReferral ? t("referrals_already_used") : t("referrals_enter_code")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasUsedReferral ? (
                <div className="text-center py-4">
                  <Check className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t("referrals_code_applied")}</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder={t("referrals_enter_placeholder")}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    className="font-mono tracking-wider uppercase"
                    maxLength={8}
                  />
                  <Button
                    onClick={handleApply}
                    disabled={!inputCode.trim() || isApplying}
                    className="glow-green shrink-0"
                  >
                    {isApplying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("apply")
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {referrals.length > 0 && (
          <Card className="bg-card border-border mt-6">
            <CardHeader>
              <CardTitle className="text-foreground">{t("referrals_history")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {referrals.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserPlus className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t("referrals_new")}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {t("referrals_credits", { amount: r.credits_awarded })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
