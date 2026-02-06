import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { TrustScoreDistribution } from "@/hooks/useAnalytics";

interface TrustDistributionChartProps {
  data: TrustScoreDistribution[];
}

const COLORS: Record<string, string> = {
  "90-100": "#22c55e", // green
  "70-89": "#3b82f6", // blue
  "50-69": "#f59e0b", // amber
  "0-49": "#ef4444", // red
};

const LABELS: Record<string, string> = {
  "90-100": "Verificado",
  "70-89": "Confiable",
  "50-69": "Sospechoso",
  "0-49": "Flaggeado",
};

export function TrustDistributionChart({ data }: TrustDistributionChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Sin datos disponibles
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: LABELS[d.range] || d.range,
    value: d.count,
    percentage: d.percentage,
    range: d.range,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ percentage }) => `${percentage}%`}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.range] || "#888"} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string) => [
              `${value} actividades`,
              name,
            ]}
          />
          <Legend
            formatter={(value) => (
              <span className="text-foreground text-sm">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
