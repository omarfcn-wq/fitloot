import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useActivityHistory, type PenaltyFilter } from "@/hooks/useActivityHistory";
import { useI18n } from "@/i18n";
import { ActivityHistoryFilters } from "@/components/history/ActivityHistoryFilters";
import { ActivityHistoryList } from "@/components/history/ActivityHistoryList";
import { ActivityHistoryPagination } from "@/components/history/ActivityHistoryPagination";
import {
  Loader2,
  History,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CREDITS_PER_MINUTE = 2;

export default function ActivityHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [activityType, setActivityType] = useState<string>("all");
  const [penaltyFilter, setPenaltyFilter] = useState<PenaltyFilter>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    setCurrentPage(0);
  }, [activityType, penaltyFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const { activities, isLoading, stats, totalPages } = useActivityHistory({
    activityType,
    penaltyFilter,
    dateFrom,
    dateTo,
    page: currentPage,
  });

  const clearFilters = () => {
    setActivityType("all");
    setPenaltyFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(0);
  };

  const hasActiveFilters =
    activityType !== "all" ||
    penaltyFilter !== "all" ||
    dateFrom !== undefined ||
    dateTo !== undefined;

  const exportToCSV = async () => {
    if (!user) return;

    let query = supabase
      .from("activities")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false });

    if (activityType !== "all") {
      query = query.eq("activity_type", activityType);
    }
    if (dateFrom) {
      query = query.gte("completed_at", dateFrom.toISOString());
    }
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte("completed_at", endOfDay.toISOString());
    }

    const { data: allActivities } = await query;
    if (!allActivities) return;

    const filteredForExport =
      penaltyFilter === "all"
        ? allActivities
        : allActivities.filter((a) => {
            const baseCredits = a.duration_minutes * CREDITS_PER_MINUTE;
            const isPenalized = a.credits_earned < baseCredits;
            return penaltyFilter === "penalized" ? isPenalized : !isPenalized;
          });

    const headers = [
      "Date", "Type", "Duration (min)", "Base Credits", "Credits Earned", "Trust Score", "Source", "Penalized",
    ];
    const rows = filteredForExport.map((a) => {
      const baseCredits = a.duration_minutes * CREDITS_PER_MINUTE;
      return [
        format(new Date(a.completed_at), "yyyy-MM-dd HH:mm"),
        a.activity_type,
        a.duration_minutes,
        baseCredits,
        a.credits_earned,
        a.trust_score ?? 100,
        a.source ?? "manual",
        a.credits_earned < baseCredits ? "Yes" : "No",
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `activities_${format(new Date(), "yyyy-MM-dd")}.csv`;
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
              <h1 className="text-3xl font-bold text-foreground">{t("history_title")}</h1>
              <p className="text-muted-foreground">{t("history_subtitle")}</p>
            </div>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {t("export_csv")}
          </Button>
        </div>

        <ActivityHistoryFilters
          activityType={activityType}
          setActivityType={setActivityType}
          penaltyFilter={penaltyFilter}
          setPenaltyFilter={setPenaltyFilter}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">{t("history_stat_activities")}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-primary">{stats.totalMinutes.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{t("history_stat_minutes")}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-emerald-400">{stats.totalCredits.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{t("history_stat_credits")}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-yellow-400">{stats.penalizedPercentage}%</p>
              <p className="text-xs text-muted-foreground">{t("history_stat_penalized", { count: stats.penalizedCount })}</p>
            </CardContent>
          </Card>
        </div>

        <ActivityHistoryList
          activities={activities}
          isLoading={isLoading}
          hasActiveFilters={hasActiveFilters}
          totalDisplayed={stats.total}
        />

        <ActivityHistoryPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </main>
    </div>
  );
}
