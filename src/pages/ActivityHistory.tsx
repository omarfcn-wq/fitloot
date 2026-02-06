import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import {
  Loader2,
  History,
  Calendar as CalendarIcon,
  Filter,
  X,
  Bike,
  Footprints,
  Dumbbell,
  Waves,
  Mountain,
  Timer,
  Coins,
  Heart,
  ArrowRight,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

const activityIcons: Record<string, React.ElementType> = {
  running: Footprints,
  cycling: Bike,
  gym: Dumbbell,
  swimming: Waves,
  hiking: Mountain,
};

const activityNames: Record<string, string> = {
  running: "Correr",
  cycling: "Ciclismo",
  gym: "Gimnasio",
  swimming: "Natación",
  hiking: "Senderismo",
};

const CREDITS_PER_MINUTE = 2;

type PenaltyFilter = "all" | "penalized" | "not_penalized";

export default function ActivityHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Filters state
  const [activityType, setActivityType] = useState<string>("all");
  const [penaltyFilter, setPenaltyFilter] = useState<PenaltyFilter>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch all user activities
  const { data: activities, isLoading } = useQuery({
    queryKey: ["activity-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Apply filters
  const filteredActivities = useMemo(() => {
    if (!activities) return [];

    return activities.filter((activity) => {
      // Activity type filter
      if (activityType !== "all" && activity.activity_type !== activityType) {
        return false;
      }

      // Penalty filter
      const baseCredits = activity.duration_minutes * CREDITS_PER_MINUTE;
      const isPenalized = activity.credits_earned < baseCredits;
      if (penaltyFilter === "penalized" && !isPenalized) return false;
      if (penaltyFilter === "not_penalized" && isPenalized) return false;

      // Date filters
      const activityDate = new Date(activity.completed_at);
      if (dateFrom && activityDate < dateFrom) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (activityDate > endOfDay) return false;
      }

      return true;
    });
  }, [activities, activityType, penaltyFilter, dateFrom, dateTo]);

  // Stats for filtered activities
  const stats = useMemo(() => {
    const total = filteredActivities.length;
    const totalMinutes = filteredActivities.reduce((sum, a) => sum + a.duration_minutes, 0);
    const totalCredits = filteredActivities.reduce((sum, a) => sum + a.credits_earned, 0);
    const totalBaseCredits = filteredActivities.reduce(
      (sum, a) => sum + a.duration_minutes * CREDITS_PER_MINUTE,
      0
    );
    const penalizedCount = filteredActivities.filter(
      (a) => a.credits_earned < a.duration_minutes * CREDITS_PER_MINUTE
    ).length;

    return {
      total,
      totalMinutes,
      totalCredits,
      totalBaseCredits,
      creditsLost: totalBaseCredits - totalCredits,
      penalizedCount,
      penalizedPercentage: total > 0 ? Math.round((penalizedCount / total) * 100) : 0,
    };
  }, [filteredActivities]);

  const clearFilters = () => {
    setActivityType("all");
    setPenaltyFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters =
    activityType !== "all" ||
    penaltyFilter !== "all" ||
    dateFrom !== undefined ||
    dateTo !== undefined;

  const exportToCSV = () => {
    const headers = [
      "Fecha",
      "Tipo",
      "Duración (min)",
      "Créditos Base",
      "Créditos Ganados",
      "Trust Score",
      "Fuente",
      "Penalizado",
    ];
    const rows = filteredActivities.map((a) => {
      const baseCredits = a.duration_minutes * CREDITS_PER_MINUTE;
      return [
        format(new Date(a.completed_at), "yyyy-MM-dd HH:mm"),
        activityNames[a.activity_type] ?? a.activity_type,
        a.duration_minutes,
        baseCredits,
        a.credits_earned,
        a.trust_score ?? 100,
        a.source ?? "manual",
        a.credits_earned < baseCredits ? "Sí" : "No",
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `actividades_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Historial de Actividades</h1>
              <p className="text-muted-foreground">
                Consulta y filtra todas tus actividades registradas
              </p>
            </div>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Filtros</CardTitle>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs">
                  <X className="h-3 w-3" />
                  Limpiar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Activity Type */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tipo de actividad</Label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="running">Correr</SelectItem>
                    <SelectItem value="cycling">Ciclismo</SelectItem>
                    <SelectItem value="gym">Gimnasio</SelectItem>
                    <SelectItem value="swimming">Natación</SelectItem>
                    <SelectItem value="hiking">Senderismo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Penalty Status */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Estado de penalización</Label>
                <Select value={penaltyFilter} onValueChange={(v) => setPenaltyFilter(v as PenaltyFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="penalized">Penalizadas</SelectItem>
                    <SelectItem value="not_penalized">Sin penalización</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "PP", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "PP", { locale: es }) : "Seleccionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Actividades</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-primary">{stats.totalMinutes.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Minutos totales</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-emerald-400">{stats.totalCredits.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Créditos ganados</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-yellow-400">{stats.penalizedPercentage}%</p>
              <p className="text-xs text-muted-foreground">Penalizadas ({stats.penalizedCount})</p>
            </CardContent>
          </Card>
        </div>

        {/* Activities List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">
              {filteredActivities.length} {filteredActivities.length === 1 ? "actividad" : "actividades"}
              {hasActiveFilters && " (filtradas)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">
                  {hasActiveFilters
                    ? "No hay actividades que coincidan con los filtros"
                    : "No has registrado actividades aún"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActivities.map((activity, index) => {
                  const Icon = activityIcons[activity.activity_type] ?? Dumbbell;
                  const baseCredits = activity.duration_minutes * CREDITS_PER_MINUTE;
                  const hasPenalty = activity.credits_earned < baseCredits;
                  const trustFlags = activity.trust_flags ?? [];
                  const trustScore = activity.trust_score ?? 100;

                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border hover:border-primary/50 transition-all animate-in fade-in-50"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="p-3 rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground">
                            {activityNames[activity.activity_type] ?? activity.activity_type}
                          </p>
                          <TrustScoreBadge score={trustScore} flags={trustFlags} />
                          {activity.source && activity.source !== "manual" && (
                            <Badge variant="outline" className="text-xs">
                              {activity.source}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap mt-1">
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {activity.duration_minutes} min
                          </span>
                          {activity.heart_rate_avg && (
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {activity.heart_rate_avg} bpm
                            </span>
                          )}
                          <span>
                            {format(new Date(activity.completed_at), "PPp", { locale: es })}
                          </span>
                        </div>
                      </div>

                      {hasPenalty ? (
                        <Badge className="shrink-0 gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <Coins className="h-3 w-3" />
                          <span className="line-through text-muted-foreground text-xs">{baseCredits}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span>+{activity.credits_earned}</span>
                        </Badge>
                      ) : (
                        <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0">
                          <Coins className="h-3 w-3 mr-1" />
                          +{activity.credits_earned}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
