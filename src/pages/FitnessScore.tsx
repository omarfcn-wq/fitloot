import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useFitnessScore } from "@/hooks/useFitnessScore";
import { useI18n } from "@/i18n";
import {
  Loader2, Heart, Flame, CalendarCheck, Clock, Repeat, Dumbbell, TrendingUp, Zap, Star,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import { motion } from "framer-motion";

function ScoreRing({ score, size = 180, t }: { score: number; size?: number; t: (key: any) => string }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 75 ? "hsl(142, 76%, 45%)" :
    score >= 50 ? "hsl(45, 100%, 55%)" :
    score >= 25 ? "hsl(30, 100%, 60%)" :
    "hsl(350, 80%, 55%)";
  const label =
    score >= 75 ? t("fitness_excellent") :
    score >= 50 ? t("fitness_good") :
    score >= 25 ? t("fitness_in_progress") :
    t("fitness_start");

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(220,16%,20%)" strokeWidth="10" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold text-foreground"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs font-medium" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, score, color }: {
  icon: React.ElementType; label: string; value: string; score: number; color: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center bg-${color}/20`}>
            <Icon className={`h-4 w-4 text-${color}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">{value}</p>
          </div>
          <span className="text-lg font-bold text-foreground">{score}</span>
        </div>
        <Progress value={score} className="h-1.5" />
      </CardContent>
    </Card>
  );
}

export default function FitnessScore() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fitness = useFitnessScore();
  const { t } = useI18n();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  if (authLoading || fitness.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const radarData = [
    { metric: t("fitness_frequency"), value: fitness.frequencyScore },
    { metric: t("fitness_duration"), value: fitness.durationScore },
    { metric: t("fitness_consistency"), value: fitness.consistencyScore },
    { metric: t("fitness_variety"), value: fitness.varietyScore },
    { metric: t("fitness_intensity"), value: fitness.intensityScore },
  ];

  const trendData = fitness.weeklyTrend.map((w) => ({
    week: w.weekLabel,
    score: w.score,
  }));

  const summaryStats = [
    { icon: CalendarCheck, label: t("fitness_active_days"), value: fitness.totalActiveDays.toString() },
    { icon: Flame, label: t("fitness_current_streak"), value: t("dashboard_streak_days", { count: fitness.currentStreak }) },
    { icon: TrendingUp, label: t("fitness_best_streak"), value: t("dashboard_streak_days", { count: fitness.longestStreak }) },
    { icon: Star, label: t("fitness_favorite_activity"), value: fitness.favoriteActivity },
    { icon: Repeat, label: t("fitness_active_weeks"), value: fitness.totalWeeksActive.toString() },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t("fitness_title")}</h1>
          <p className="text-muted-foreground">{t("fitness_subtitle")}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  {t("fitness_score")}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <ScoreRing score={fitness.overallScore} t={t} />
                <p className="text-sm text-muted-foreground text-center max-w-xs">{t("fitness_who_note")}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card border-border h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  {t("fitness_performance")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke="hsl(220,16%,20%)" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fill: "hsl(215,20%,65%)", fontSize: 12 }}
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      dataKey="value"
                      stroke="hsl(142, 76%, 45%)"
                      fill="hsl(142, 76%, 45%)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <MetricCard
            icon={CalendarCheck}
            label={t("fitness_frequency")}
            value={t("fitness_frequency_desc")}
            score={fitness.frequencyScore}
            color="primary"
          />
          <MetricCard
            icon={Clock}
            label={t("fitness_duration")}
            value={t("fitness_duration_desc")}
            score={fitness.durationScore}
            color="sky-400"
          />
          <MetricCard
            icon={Repeat}
            label={t("fitness_consistency")}
            value={t("fitness_consistency_desc")}
            score={fitness.consistencyScore}
            color="amber-400"
          />
          <MetricCard
            icon={Dumbbell}
            label={t("fitness_variety")}
            value={t("fitness_variety_desc")}
            score={fitness.varietyScore}
            color="violet-400"
          />
          <MetricCard
            icon={Flame}
            label={t("fitness_intensity")}
            value={t("fitness_intensity_desc")}
            score={fitness.intensityScore}
            color="orange-400"
          />
        </div>

        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle className="text-base">{t("fitness_weekly_evolution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,16%,20%)" />
                <XAxis dataKey="week" stroke="hsl(215,20%,55%)" fontSize={12} />
                <YAxis stroke="hsl(215,20%,55%)" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220,18%,10%)",
                    border: "1px solid hsl(220,16%,20%)",
                    borderRadius: "8px",
                    color: "hsl(210,40%,98%)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(142, 76%, 45%)"
                  fill="url(#scoreGradient)"
                  strokeWidth={2}
                  name="Score"
                  dot={{ fill: "hsl(142, 76%, 45%)", r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {summaryStats.map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
