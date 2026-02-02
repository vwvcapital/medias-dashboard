import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp } from "lucide-react";
interface MonthlyTrendChartProps {
  data: {
    mes: string;
    mediaCarregado: number;
    kmTotal: number;
  }[];
}
export function MonthlyTrendChart({
  data
}: MonthlyTrendChartProps) {
  return <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{
    animationDelay: "400ms"
  }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Tendência Mensal</h3>
          <p className="text-sm text-muted-foreground">Evolução da média carregado</p>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{
          left: 0,
          right: 20
        }}>
            <defs>
              <linearGradient id="colorMedia" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="mes" tick={{
            fill: "hsl(var(--muted-foreground))",
            fontSize: 12
          }} axisLine={{
            stroke: "hsl(var(--border))"
          }} />
            <YAxis tick={{
            fill: "hsl(var(--muted-foreground))",
            fontSize: 12
          }} axisLine={{
            stroke: "hsl(var(--border))"
          }} domain={["dataMin - 0.5", "dataMax + 0.5"]} tickFormatter={(value: number) => value.toFixed(2)} />
            <Tooltip contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.75rem"
          }} labelStyle={{
            color: "hsl(var(--foreground))"
          }} formatter={(value: number) => [value.toFixed(2) + " km/l", "Média Carregado"]} />
            <Area type="monotone" dataKey="mediaCarregado" stroke="hsl(160, 84%, 39%)" strokeWidth={3} fill="url(#colorMedia)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>;
}