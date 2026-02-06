import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Coins, Gift, Watch, TrendingUp } from "lucide-react";
import type { AdminStats as AdminStatsType } from "@/hooks/useAdmin";

interface AdminStatsProps {
  stats: AdminStatsType;
}

export function AdminStats({ stats }: AdminStatsProps) {
  const statCards = [
    {
      title: "Usuarios Totales",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Actividades Registradas",
      value: stats.totalActivities,
      icon: Activity,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Créditos Generados",
      value: stats.totalCreditsEarned.toLocaleString(),
      icon: Coins,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Créditos Canjeados",
      value: stats.totalCreditsSpent.toLocaleString(),
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Canjes Realizados",
      value: stats.totalRedemptions,
      icon: Gift,
      color: "text-pink-400",
      bgColor: "bg-pink-500/10",
    },
    {
      title: "Wearables Conectados",
      value: stats.activeWearableConnections,
      icon: Watch,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat) => (
        <Card key={stat.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
