import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { WearableCard } from "@/components/WearableCard";
import { useAuth } from "@/hooks/useAuth";
import { useWearables } from "@/hooks/useWearables";
import { Loader2, Watch, Activity, Apple, Smartphone } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
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
  } = useWearables();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Handle OAuth callbacks
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      if (success === "fitbit_connected") {
        toast.success("¡Fitbit conectado exitosamente!");
      } else if (success === "google_connected") {
        toast.success("¡Google Fit conectado exitosamente!");
      }
      setSearchParams({});
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        fitbit_denied: "Permiso de Fitbit denegado",
        google_denied: "Permiso de Google Fit denegado",
        missing_params: "Parámetros faltantes en la respuesta",
        invalid_state: "Estado inválido en la respuesta",
        token_exchange_failed: "Error al intercambiar el token",
        database_error: "Error al guardar la conexión",
        internal_error: "Error interno del servidor",
      };
      toast.error(errorMessages[error] || "Error al conectar el wearable");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

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
      description: "Sincroniza actividades desde tu Fitbit",
      icon: <Watch className="h-6 w-6" />,
    },
    {
      provider: "google_fit" as const,
      name: "Google Fit",
      description: "Conecta con Google Fit y Android Wear",
      icon: <Activity className="h-6 w-6" />,
    },
    {
      provider: "apple_health" as const,
      name: "Apple Health",
      description: "Requiere app móvil nativa (próximamente)",
      icon: <Apple className="h-6 w-6" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona tus conexiones de wearables y preferencias
          </p>
        </div>

        {/* Wearable Connections */}
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Smartphone className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Dispositivos Conectados</CardTitle>
                <CardDescription>
                  Conecta tus wearables para sincronizar actividades automáticamente
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
                        onSuccess: () => toast.success(`${wearable.name} desconectado`),
                        onError: () => toast.error(`Error al desconectar ${wearable.name}`),
                      });
                    }}
                    onSync={() => {
                      syncActivities(wearable.provider, {
                        onSuccess: (data) => {
                          const result = data?.results?.[wearable.provider];
                          if (result?.error) {
                            toast.error(`Error: ${result.error}`);
                          } else if (result?.creditsEarned > 0) {
                            toast.success(
                              `¡Sincronizado! +${result.creditsEarned} créditos ganados`
                            );
                          } else {
                            toast.info("Sincronizado. No hay actividades nuevas.");
                          }
                        },
                        onError: () => toast.error("Error al sincronizar"),
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

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary h-fit">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Sincronización Automática
                </h3>
                <p className="text-sm text-muted-foreground">
                  Una vez conectado, tus actividades se sincronizarán automáticamente
                  y recibirás <span className="text-primary font-medium">2 créditos por cada minuto</span> de ejercicio
                  registrado en tu wearable.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
