import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { cn } from "@/lib/utils";

export interface PenaltyMetrics {
  penalizedActivities: number;
  nonPenalizedActivities: number;
  penaltyPercentage: number;
  totalBaseCredits: number;
  totalAdjustedCredits: number;
  creditsLost: number;
  byMultiplier: {
    multiplier: string;
    count: number;
    creditsLost: number;
  }[];
}

interface PenaltyMetricsChartProps {
  data: PenaltyMetrics | null;
}

export function PenaltyMetricsChart({ data }: PenaltyMetricsChartProps) {
  if (!data) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Sin datos disponibles
      </div>
    );
  }

  const pieData = [
    { name: "Sin penalización", value: data.nonPenalizedActivities, color: "hsl(142, 76%, 45%)" },
    { name: "Penalizadas 0.5x", value: data.byMultiplier.find(m => m.multiplier === "0.5")?.count ?? 0, color: "hsl(45, 100%, 50%)" },
    { name: "Penalizadas 0.25x", value: data.byMultiplier.find(m => m.multiplier === "0.25")?.count ?? 0, color: "hsl(0, 84%, 60%)" },
  ].filter(d => d.value > 0);

  const creditsData = [
    { name: "Créditos Base", value: data.totalBaseCredits, fill: "hsl(200, 95%, 50%)" },
    { name: "Créditos Ajustados", value: data.totalAdjustedCredits, fill: "hsl(142, 76%, 45%)" },
    { name: "Créditos Perdidos", value: data.creditsLost, fill: "hsl(0, 84%, 60%)" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-2xl font-bold text-foreground">{data.penaltyPercentage}%</p>
          <p className="text-xs text-muted-foreground">Actividades penalizadas</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-2xl font-bold text-primary">{data.totalBaseCredits.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Créditos base totales</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-2xl font-bold text-emerald-400">{data.totalAdjustedCredits.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Créditos otorgados</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <p className={cn(
            "text-2xl font-bold",
            data.creditsLost > 0 ? "text-red-400" : "text-muted-foreground"
          )}>
            {data.creditsLost > 0 ? `-${data.creditsLost.toLocaleString()}` : "0"}
          </p>
          <p className="text-xs text-muted-foreground">Créditos retenidos</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Activity Distribution */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Distribución de Actividades</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pieData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  width={120}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Credits Comparison */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Comparativa de Créditos</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={creditsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [value.toLocaleString(), "Créditos"]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {creditsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Effectiveness Message */}
      {data.creditsLost > 0 && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">Sistema VDC efectivo:</span>{" "}
            {data.penalizedActivities} actividades penalizadas resultaron en{" "}
            <span className="font-medium text-red-400">{data.creditsLost.toLocaleString()} créditos retenidos</span>,
            {" "}un ahorro del {Math.round((data.creditsLost / data.totalBaseCredits) * 100)}% respecto a créditos base.
          </p>
        </div>
      )}
    </div>
  );
}
