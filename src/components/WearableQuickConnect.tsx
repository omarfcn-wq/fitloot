import { Watch, Loader2, Link2, RefreshCw, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWearables, type WearableProvider } from "@/hooks/useWearables";
import { useI18n } from "@/i18n";
import { toast } from "sonner";

const PROVIDERS: { id: WearableProvider; nameKey: string; descKey: string; icon: string }[] = [
  { id: "fitbit", nameKey: "wearable_fitbit", descKey: "wearable_fitbit_desc", icon: "⌚" },
  { id: "google_fit", nameKey: "wearable_google_fit", descKey: "wearable_google_fit_desc", icon: "🏃" },
  { id: "apple_health", nameKey: "wearable_apple_health", descKey: "wearable_apple_health_desc", icon: "🍎" },
];

export function WearableQuickConnect({ variant = "icon" }: { variant?: "icon" | "card" }) {
  const { t } = useI18n();
  const {
    connections,
    isLoading,
    isConnecting,
    isDisconnecting,
    isSyncing,
    connectWearable,
    disconnectWearable,
    syncActivities,
    getConnectionStats,
  } = useWearables();

  const stats = getConnectionStats();
  const hasActive = stats.activeConnections > 0;

  const handleConnect = (provider: WearableProvider) => {
    if (provider === "apple_health") {
      toast.info(t("coming_soon"));
      return;
    }
    connectWearable(provider);
  };

  const handleDisconnect = (provider: WearableProvider) => {
    disconnectWearable(provider, {
      onSuccess: () => toast.success(t("disconnected")),
      onError: () => toast.error("Error"),
    });
  };

  const handleSync = (provider: WearableProvider) => {
    syncActivities(provider, {
      onSuccess: (data) => {
        toast.success(`+${data.activitiesAdded} actividades, +${data.creditsEarned} créditos`);
      },
      onError: () => toast.error("Error al sincronizar"),
    });
  };

  const getConnectionForProvider = (provider: WearableProvider) =>
    connections.find((c) => c.provider === provider && c.is_active);

  const content = (
    <div className="space-y-3">
      {PROVIDERS.map((p) => {
        const conn = getConnectionForProvider(p.id);
        const isActive = !!conn;

        return (
          <div
            key={p.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{p.icon}</span>
              <div>
                <p className="font-medium text-sm text-foreground">{t(p.nameKey as any)}</p>
                <p className="text-xs text-muted-foreground">{t(p.descKey as any)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isActive ? (
                <>
                  <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    {t("connected")}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleSync(p.id)}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDisconnect(p.id)}
                    disabled={isDisconnecting}
                  >
                    {isDisconnecting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Unlink className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-8 text-xs"
                  onClick={() => handleConnect(p.id)}
                  disabled={isConnecting || p.id === "apple_health"}
                >
                  {isConnecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5" />
                  )}
                  {p.id === "apple_health" ? t("coming_soon") : t("connect")}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (variant === "card") {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Watch className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t("wearable_quick_connect")}</p>
                <p className="text-xs text-muted-foreground">
                  {isLoading
                    ? t("loading")
                    : hasActive
                    ? t("wearable_active_connections", { count: stats.activeConnections })
                    : t("wearable_no_devices")}
                </p>
              </div>
            </div>
            {hasActive && (
              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                {stats.activeConnections}
              </Badge>
            )}
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("wearable_connect_device")}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // Icon variant for navbar
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Watch className="h-5 w-5" />
          {hasActive && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("wearable_connect_device")}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
