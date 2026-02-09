import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useWeeklyMetrics } from "@/hooks/useWeeklyMetrics";
import { Loader2, Clock, Coins, Flame, Activity, TrendingUp, TrendingDown, Minus, CalendarDays } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(142, 76%, 45%)",
  "hsl(263, 70%, 58%)",
  "hsl(199, 89%, 60%)",
  "hsl(30, 100%, 60%)",
  "hsl(350, 80%, 55%)",
  "hsl(45, 100%, 55%)",
];

function TrendBadge({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
        <TrendingUp className="h-3 w-3" /> +{value}%
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
        <TrendingDown className="h-3 w-3" /> {value}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
      <Minus className="h-3 w-3" /> 0%
    </span>
  );
}

export default function WeeklyMetrics() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { currentWeek, prevWeek, comparisons, weekLabel, isLoading } = useWeeklyMetrics();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Minutos Totales",
      value: currentWeek.totalMinutes,
      prev: prevWeek.totalMinutes,
      trend: comparisons.minutes,
      icon: Clock,
      color: "text-sky-400",
    },
    {
      title: "Créditos Ganados",
      value: currentWeek.totalCredits,
      prev: prevWeek.totalCredits,
      trend: comparisons.credits,
      icon: Coins,
      color: "text-primary",
    },
    {
      title: "Calorías Quemadas",
      value: currentWeek.totalCalories,
      prev: prevWeek.totalCalories,
      trend: comparisons.calories,
      icon: Flame,
      color: "text-orange-400",
    },
    {
      title: "Actividades",
      value: currentWeek.totalActivities,
      prev: prevWeek.totalActivities,
      trend: comparisons.activities,
      icon: Activity,
      color: "text-secondary",
    },
  ];

  // Comparison data for bar chart
  const comparisonData = currentWeek.dailyMetrics.map((d, i) => ({
    day: d.dayShort,
    "Esta semana": d.minutes,
    "Semana anterior": prevWeek.dailyMetrics[i]?.minutes ?? 0,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Métricas Semanales</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {weekLabel}
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value.toLocaleString()}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    vs. {stat.prev.toLocaleString()}
                  </span>
                  <TrendBadge value={stat.trend} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Daily minutes comparison */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-base">
                Minutos por Día — Comparativa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 20%)" />
                  <XAxis dataKey="day" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220, 18%, 10%)",
                      border: "1px solid hsl(220, 16%, 20%)",
                      borderRadius: "8px",
                      color: "hsl(210, 40%, 98%)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Esta semana" fill="hsl(142, 76%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Semana anterior" fill="hsl(263, 70%, 58%)" radius={[4, 4, 0, 0]} opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Credits trend */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-base">
                Créditos Ganados por Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={currentWeek.dailyMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 16%, 20%)" />
                  <XAxis dataKey="dayShort" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(220, 18%, 10%)",
                      border: "1px solid hsl(220, 16%, 20%)",
                      borderRadius: "8px",
                      color: "hsl(210, 40%, 98%)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="credits"
                    stroke="hsl(142, 76%, 45%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(142, 76%, 45%)", r: 4 }}
                    name="Créditos"
                  />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="hsl(30, 100%, 60%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(30, 100%, 60%)", r: 4 }}
                    name="Calorías"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity type distribution */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-base">
                Distribución por Tipo de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentWeek.byType.length === 0 ? (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                  Sin actividades esta semana
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={currentWeek.byType}
                      dataKey="minutes"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ type, percent }) =>
                        `${type} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {currentWeek.byType.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(220, 18%, 10%)",
                        border: "1px solid hsl(220, 16%, 20%)",
                        borderRadius: "8px",
                        color: "hsl(210, 40%, 98%)",
                      }}
                      formatter={(value: number) => [`${value} min`, "Minutos"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Trust Score & Summary */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-base">
                Resumen Semanal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">Trust Score Promedio</p>
                  <p className="text-3xl font-bold text-foreground">
                    {currentWeek.avgTrustScore}
                  </p>
                </div>
                <div
                  className={`h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold ${
                    currentWeek.avgTrustScore >= 70
                      ? "bg-primary/20 text-primary"
                      : currentWeek.avgTrustScore >= 50
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-destructive/20 text-destructive"
                  }`}
                >
                  {currentWeek.avgTrustScore >= 70 ? "✓" : currentWeek.avgTrustScore >= 50 ? "!" : "✗"}
                </div>
              </div>

              {currentWeek.byType.length > 0 ? (
                <div className="space-y-3">
                  {currentWeek.byType.map((item, i) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="text-sm text-foreground capitalize">{item.type}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {item.count} sesiones · {item.minutes} min
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Registra actividades para ver tu resumen semanal
                </p>
              )}

              <div className="pt-2 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Promedio diario</span>
                  <span className="text-foreground font-medium">
                    {currentWeek.totalActivities > 0
                      ? Math.round(currentWeek.totalMinutes / 7)
                      : 0}{" "}
                    min/día
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
