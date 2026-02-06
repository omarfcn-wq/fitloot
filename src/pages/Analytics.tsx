import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import { TrustDistributionChart } from "@/components/analytics/TrustDistributionChart";
import { TrustBySourceChart } from "@/components/analytics/TrustBySourceChart";
import { TrustByActivityChart } from "@/components/analytics/TrustByActivityChart";
import { TrustTrendChart } from "@/components/analytics/TrustTrendChart";
import { FlagFrequencyChart } from "@/components/analytics/FlagFrequencyChart";
import { PenaltyMetricsChart } from "@/components/analytics/PenaltyMetricsChart";
import {
  Loader2,
  BarChart3,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Activity,
  TrendingUp,
  Coins,
} from "lucide-react";

export default function Analytics() {
  const { user, loading: authLoading } = useAuth();
  const { analytics, isLoading, isAdmin } = useAnalytics();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!isLoading && !isAdmin && user) {
      navigate("/dashboard");
    }
  }, [isAdmin, isLoading, user, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">Acceso Denegado</h1>
        <p className="text-muted-foreground">Solo para administradores</p>
      </div>
    );
  }

  const kpis = [
    {
      title: "Actividades Totales",
      value: analytics?.totalActivities ?? 0,
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Trust Score Promedio",
      value: `${analytics?.avgTrustScore ?? 0}%`,
      icon: TrendingUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Verificadas (90+)",
      value: analytics?.verifiedActivities ?? 0,
      icon: ShieldCheck,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Sospechosas (50-69)",
      value: analytics?.suspiciousActivities ?? 0,
      icon: AlertTriangle,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Flaggeadas (<50)",
      value: analytics?.flaggedActivities ?? 0,
      icon: ShieldAlert,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Analytics - Trust Score
            </h1>
          </div>
          <p className="text-muted-foreground">
            Métricas agregadas del sistema anti-fraude VDC para demostración a inversores
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {kpis.map((kpi) => (
            <Card key={kpi.title} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                    <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Distribución de Trust Score</CardTitle>
              <CardDescription>
                Porcentaje de actividades por rango de puntuación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrustDistributionChart data={analytics?.distribution ?? []} />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Trust Score por Fuente</CardTitle>
              <CardDescription>
                Comparación entre wearables vs entrada manual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrustBySourceChart data={analytics?.bySource ?? []} />
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Tendencia Últimos 7 Días</CardTitle>
              <CardDescription>
                Evolución del trust score promedio diario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrustTrendChart data={analytics?.recentTrend ?? []} />
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Trust Score por Actividad</CardTitle>
              <CardDescription>
                Puntuación promedio por tipo de ejercicio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrustByActivityChart data={analytics?.byActivity ?? []} />
            </CardContent>
          </Card>
        </div>

        {/* Penalty Metrics */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Métricas de Penalización</CardTitle>
            </div>
            <CardDescription>
              Impacto del sistema VDC en la economía de créditos: actividades penalizadas y créditos retenidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PenaltyMetricsChart data={analytics?.penaltyMetrics ?? null} />
          </CardContent>
        </Card>

        {/* Flags Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Frecuencia de Alertas</CardTitle>
            <CardDescription>
              Distribución de flags de validación detectados por el sistema VDC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FlagFrequencyChart data={analytics?.flagFrequency ?? []} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
