import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { WearableCard } from "@/components/WearableCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useWearables } from "@/hooks/useWearables";
import { useI18n } from "@/i18n";
import { Loader2, Watch, Activity, Apple, Smartphone, Zap, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { UserProfileForm } from "@/components/UserProfileForm";
import { BluetoothDevices } from "@/components/BluetoothDevices";

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const {
    connections,
    isLoading,
    connectWearable,
    isConnecting,
    disconnectWearable,
    isDisconnecting,
    syncActivities,
    isSyncing,
    getConnection,
    syncAllProviders,
    getConnectionStats
  } = useWearables();
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      toast.success(t("connected") + " 🎉");
      
      if (success.includes('fitbit')) {
        setTimeout(() => syncActivities('fitbit'), 2000);
      } else if (success.includes('google')) {
        setTimeout(() => syncActivities('google_fit'), 2000);
      }
      
      setSearchParams({});
    }

    if (error) {
      toast.error(t("log_activity_error"));
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, syncActivities]);

  const handleSyncAll = async () => {
    try {
      setSyncProgress(10);
      const result = await syncAllProviders();
      
      setSyncProgress(80);
      
      let totalCredits = 0;
      let totalActivities = 0;
      let hasErrors = false;

      Object.entries(result.results).forEach(([provider, data]) => {
        if (data.success) {
          totalCredits += data.creditsEarned;
          totalActivities += data.activitiesAdded;
        } else {
          hasErrors = true;
          toast.error(`${provider}: ${data.error}`);
        }
      });

      setSyncProgress(100);
      
      if (totalActivities > 0) {
        toast.success(
          `${totalActivities} +${totalCredits} 🏆`
        );
      } else if (!hasErrors) {
        toast.info(t("wearable_no_devices"));
      }
      
      setTimeout(() => setSyncProgress(0), 1000);
    } catch (error: any) {
      setSyncProgress(0);
      toast.error(t("log_activity_error"));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const wearables = [
    {
      provider: "fitbit" as const,
      name: "Fitbit",
      description: t("settings_fitbit_desc"),
      icon: <Watch className="h-6 w-6" />,
    },
    {
      provider: "google_fit" as const,
      name: "Google Fit",
      description: t("settings_google_fit_desc"),
      icon: <Activity className="h-6 w-6" />,
    },
    {
      provider: "apple_health" as const,
      name: "Apple Health",
      description: t("settings_apple_health_desc"),
      icon: <Apple className="h-6 w-6" />,
    },
  ];

  const stats = getConnectionStats();
  const hasActiveConnections = stats.activeConnections > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t("settings_title")}</h1>
          <p className="text-muted-foreground">{t("settings_subtitle")}</p>
        </div>

        <UserProfileForm />

        <div className="mt-6" />

        {hasActiveConnections && (
          <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/20 text-primary">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {t("settings_devices_connected", { count: stats.activeConnections })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {stats.lastSyncAt 
                        ? t("settings_last_sync", { time: new Date(stats.lastSyncAt).toLocaleString() })
                        : t("settings_never_synced")
                      }
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSyncAll}
                  disabled={isSyncing}
                  className="gap-2"
                  size="lg"
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrendingUp className="h-4 w-4" />
                  )}
                  {t("settings_sync_all")}
                </Button>
              </div>
              
              {syncProgress > 0 && (
                <div className="mt-4">
                  <Progress value={syncProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("settings_syncing", { progress: syncProgress })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Smartphone className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>{t("settings_fitness_devices")}</CardTitle>
                <CardDescription>{t("settings_fitness_devices_desc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {wearables.map((wearable) => (
                  <WearableCard
                    key={wearable.provider}
                    {...wearable}
                    connection={getConnection(wearable.provider)}
                    onConnect={() => connectWearable(wearable.provider)}
                    onDisconnect={() => {
                      disconnectWearable(wearable.provider, {
                        onSuccess: () => toast.success(`${wearable.name} ${t("disconnected").toLowerCase()}`),
                        onError: () => toast.error(t("log_activity_error")),
                      });
                    }}
                    onSync={() => {
                      syncActivities(wearable.provider, {
                        onSuccess: (data) => {
                          if (data.creditsEarned > 0) {
                            toast.success(
                              `${data.activitiesAdded} +${data.creditsEarned} 🎯`
                            );
                          } else {
                            toast.info(t("wearable_no_devices"));
                          }
                        },
                        onError: () => toast.error(t("log_activity_error")),
                      });
                    }}
                    isConnecting={isConnecting}
                    isDisconnecting={isDisconnecting}
                    isSyncing={isSyncing}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6">
          <BluetoothDevices />
        </div>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="p-3 rounded-xl bg-green-500/20 text-green-400 h-fit">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t("settings_rewards_system")}</h3>
                <p className="text-sm text-muted-foreground mb-2">{t("settings_rewards_desc")}</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>{t("settings_reward_base")}</strong></li>
                  <li>• <strong>{t("settings_reward_effort")}</strong></li>
                  <li>• <strong>{t("settings_reward_hr")}</strong></li>
                  <li>• <strong>{t("settings_reward_anticheat")}</strong></li>
                </ul>
                <p className="text-sm text-primary font-medium mt-3">{t("settings_reward_cta")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
