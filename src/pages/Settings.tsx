import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { WearableCard } from "@/components/WearableCard";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useWearables } from "@/hooks/useWearables";
import { Loader2, Watch, Activity, Apple, Smartphone, Zap, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { UserProfileForm } from "@/components/UserProfileForm";
import { BluetoothDevices } from "@/components/BluetoothDevices";

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

  // Handle OAuth callbacks with better UX
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success) {
      const successMessages: Record<string, string> = {
        fitbit_connected: "¡Fitbit conectado exitosamente! 🎉",
        google_connected: "¡Google Fit conectado exitosamente! 🎉"
      };
      
      toast.success(successMessages[success] || "¡Dispositivo conectado!");
      
      // Auto-sync after successful connection
      if (success.includes('fitbit')) {
        setTimeout(() => syncActivities('fitbit'), 2000);
      } else if (success.includes('google')) {
        setTimeout(() => syncActivities('google_fit'), 2000);
      }
      
      setSearchParams({});
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        fitbit_denied: "Permiso de Fitbit denegado. Intenta de nuevo.",
        google_denied: "Permiso de Google Fit denegado. Intenta de nuevo.",
        missing_params: "Error en la respuesta del dispositivo",
        invalid_state: "Sesión de seguridad inválida. Intenta conectar de nuevo.",
        token_exchange_failed: "Error al obtener permisos. Verifica tu cuenta.",
        database_error: "Error interno. Contacta soporte si persiste.",
        internal_error: "Error interno del servidor"
      };
      
      toast.error(errorMessages[error] || "Error al conectar el dispositivo");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, syncActivities]);

  // Sync all connected devices
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
          toast.error(`Error sincronizando ${provider}: ${data.error}`);
        }
      });

      setSyncProgress(100);
      
      if (totalActivities > 0) {
        toast.success(
          `¡${totalActivities} actividades sincronizadas! +${totalCredits} créditos ganados 🏆`
        );
      } else if (!hasErrors) {
        toast.info("Sincronización completa. No hay actividades nuevas.");
      }
      
      setTimeout(() => setSyncProgress(0), 1000);
    } catch (error: any) {
      setSyncProgress(0);
      toast.error("Error en sincronización masiva");
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
      description: "Sincroniza actividades, pasos y frecuencia cardíaca",
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

  const stats = getConnectionStats();
  const hasActiveConnections = stats.activeConnections > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">
            Gestiona tus dispositivos fitness y obtén recompensas por ejercitarte
          </p>
        </div>

        {/* User Profile */}
        <UserProfileForm />

        <div className="mt-6" />

        {/* Connection Stats */}
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
                      {stats.activeConnections} dispositivo{stats.activeConnections !== 1 ? 's' : ''} conectado{stats.activeConnections !== 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {stats.lastSyncAt ? 
                        `Última sincronización: ${new Date(stats.lastSyncAt).toLocaleString('es-ES')}` :
                        'Nunca sincronizado'
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
                  Sincronizar Todo
                </Button>
              </div>
              
              {syncProgress > 0 && (
                <div className="mt-4">
                  <Progress value={syncProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Sincronizando dispositivos... {syncProgress}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Wearable Connections */}
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Smartphone className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Dispositivos Fitness</CardTitle>
                <CardDescription>
                  Conecta tus dispositivos para ganar tokens automáticamente
                </CardDescription>
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
                        onSuccess: () => toast.success(`${wearable.name} desconectado`),
                        onError: () => toast.error(`Error al desconectar ${wearable.name}`),
                      });
                    }}
                    onSync={() => {
                      syncActivities(wearable.provider, {
                        onSuccess: (data) => {
                          if (data.creditsEarned > 0) {
                            toast.success(
                              `¡${data.activitiesAdded} actividades! +${data.creditsEarned} créditos 🎯`
                            );
                          } else {
                            toast.info("Sin actividades nuevas para sincronizar");
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

        {/* Rewards Info */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="p-3 rounded-xl bg-green-500/20 text-green-400 h-fit">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Sistema de Recompensas Inteligente
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Gana tokens basados en tu esfuerzo real y perfil físico:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>2 tokens base</strong> por cada minuto de ejercicio</li>
                  <li>• <strong>Bonus de esfuerzo</strong> según tu condición física</li>
                  <li>• <strong>Multiplicador cardíaco</strong> para mayor intensidad</li>
                  <li>• <strong>Validación anti-trampa</strong> con puntuación de confianza</li>
                </ul>
                <p className="text-sm text-primary font-medium mt-3">
                  ¡El ejercicio nunca fue tan rewarding! 🏆
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
