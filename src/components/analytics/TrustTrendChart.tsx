import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrustTrendChartProps {
  data: { date: string; avgScore: number; count: number }[];
}

export function TrustTrendChart({ data }: TrustTrendChartProps) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Sin datos disponibles
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="trustGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number, name: string, props) => [
              props.payload.count > 0
                ? `${value}% (${props.payload.count} actividades)`
                : "Sin actividades",
              "Trust Score",
            ]}
          />
          <Area
            type="monotone"
            dataKey="avgScore"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#trustGradient)"
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
