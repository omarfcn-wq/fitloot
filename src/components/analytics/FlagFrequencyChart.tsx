import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TrustFlagFrequency } from "@/hooks/useAnalytics";

interface FlagFrequencyChartProps {
  data: TrustFlagFrequency[];
}

const FLAG_COLORS: Record<string, string> = {
  wearable_verified: "#22c55e",
  manual_entry: "#f59e0b",
  no_biometric_data: "#ef4444",
  duration_too_short: "#f97316",
  duration_too_long: "#f97316",
  low_heart_rate: "#ec4899",
  high_heart_rate: "#ec4899",
  mechanical_heart_rate: "#dc2626",
  calorie_mismatch: "#a855f7",
};

export function FlagFrequencyChart({ data }: FlagFrequencyChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Sin alertas detectadas
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            dataKey="label"
            type="category"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            width={150}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [`${value} ocurrencias`, "Frecuencia"]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={FLAG_COLORS[entry.flag] || "#64748b"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
