import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link2, Unlink, RefreshCw } from "lucide-react";
import type { WearableProvider, WearableConnection } from "@/hooks/useWearables";

interface WearableCardProps {
  provider: WearableProvider;
  name: string;
  description: string;
  icon: React.ReactNode;
  connection?: WearableConnection;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isSyncing: boolean;
}

export function WearableCard({
  provider,
  name,
  description,
  icon,
  connection,
  onConnect,
  onDisconnect,
  onSync,
  isConnecting,
  isDisconnecting,
  isSyncing,
}: WearableCardProps) {
  const isConnected = !!connection?.is_active;
  const lastSync = connection?.last_sync_at
    ? new Date(connection.last_sync_at).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{name}</CardTitle>
            {isConnected ? (
              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
                Conectado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Desconectado
              </Badge>
            )}
          </div>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-3">
            {lastSync && (
              <p className="text-sm text-muted-foreground">
                Última sincronización: {lastSync}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onSync}
                disabled={isSyncing}
                className="gap-2"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sincronizar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDisconnect}
                disabled={isDisconnecting}
                className="gap-2 text-destructive hover:text-destructive"
              >
                {isDisconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Unlink className="h-4 w-4" />
                )}
                Desconectar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={onConnect}
            disabled={isConnecting || provider === "apple_health"}
            className="gap-2"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            {provider === "apple_health" ? "Próximamente" : "Conectar"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
