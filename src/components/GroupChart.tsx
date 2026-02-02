import { useMemo, useState, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Layers } from "lucide-react";
import { ProcessedFleetData } from "@/types/fleet";
import { formatNumber } from "@/utils/fleetUtils";

interface GroupChartProps {
  data: ProcessedFleetData[];
}

// Cores únicas para cada grupo - sem repetição
const GROUP_COLORS: Record<string, string> = {
  "FRANGO": "#10b981",      // Esmeralda
  "SUINO": "#3b82f6",       // Azul
  "CONFINAMENTO": "#f59e0b", // Âmbar
  "AVES": "#8b5cf6",        // Violeta
  "BOVINO": "#ef4444",      // Vermelho
};

// Cores de fallback para grupos adicionais
const FALLBACK_COLORS = [
  "#06b6d4", // Ciano
  "#ec4899", // Rosa
  "#84cc16", // Lima
  "#f97316", // Laranja
  "#6366f1", // Índigo
  "#14b8a6", // Teal
  "#a855f7", // Roxo
  "#f43f5e", // Rosa forte
  "#22c55e", // Verde
  "#eab308", // Amarelo
];

const MAX_INITIAL_GROUPS = 5;

export function GroupChart({ data }: GroupChartProps) {
  const groups = useMemo(() => [...new Set(data.map((d) => d.Grupo))].sort(), [data]);
  
  // Initialize with only the first 5 groups active
  const [activeGroups, setActiveGroups] = useState<Set<string>>(() => {
    return new Set(groups.slice(0, MAX_INITIAL_GROUPS));
  });

  const chartData = useMemo(() => {
    // Get all unique months sorted from oldest to most recent (left to right)
    const months = [...new Set(data.map((d) => d.Mês))].sort((a, b) => {
      const [mesA, anoA] = a.split("/");
      const [mesB, anoB] = b.split("/");
      return anoA.localeCompare(anoB) || mesA.localeCompare(mesB);
    });

    // Calculate average for each group per month
    return months.map((mes) => {
      const monthData = data.filter((d) => d.Mês === mes);
      const result: Record<string, string | number> = { mes };

      groups.forEach((grupo) => {
        const groupMonthData = monthData.filter((d) => d.Grupo === grupo);
        if (groupMonthData.length > 0) {
          const avg = groupMonthData.reduce((acc, d) => acc + d.mediaCarregadoNum, 0) / groupMonthData.length;
          result[grupo] = avg;
        }
      });

      return result;
    });
  }, [data, groups]);

  const getGroupColor = useCallback((grupo: string, index: number) => {
    return GROUP_COLORS[grupo] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  }, []);

  const handleLegendClick = useCallback((dataKey: string) => {
    setActiveGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dataKey)) {
        newSet.delete(dataKey);
      } else {
        newSet.add(dataKey);
      }
      return newSet;
    });
  }, []);

  const renderLegend = useCallback((props: { payload?: Array<{ value: string; color: string; dataKey: string }> }) => {
    const { payload } = props;
    if (!payload) return null;

    return (
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {payload.map((entry, index) => {
          const isActive = activeGroups.has(entry.dataKey);
          return (
            <button
              key={`legend-${index}`}
              onClick={() => handleLegendClick(entry.dataKey)}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all
                ${isActive 
                  ? 'opacity-100' 
                  : 'opacity-40 hover:opacity-60'
                }
              `}
              style={{
                backgroundColor: isActive ? `${entry.color}20` : 'transparent',
                border: `1px solid ${entry.color}`,
                color: entry.color,
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.value}
            </button>
          );
        })}
      </div>
    );
  }, [activeGroups, handleLegendClick]);

  return (
    <div className="glass-card rounded-2xl p-6 animate-slide-up w-full" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-chart-4/20 flex items-center justify-center">
          <Layers className="w-5 h-5 text-chart-4" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Desempenho por Grupo</h3>
          <p className="text-sm text-muted-foreground">Média carregado por grupo ao longo do tempo (km/l)</p>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {activeGroups.size}/{groups.length} grupos ativos
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="mes" 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
            />
            <YAxis 
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(value) => value.toFixed(2)}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length > 0) {
                  // Sort payload by value (highest to lowest)
                  const sortedPayload = [...payload].sort((a, b) => 
                    (b.value as number) - (a.value as number)
                  );
                  return (
                    <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
                      <div className="font-medium mb-2">{label}</div>
                      <div className="space-y-1">
                        {sortedPayload.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <span 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: entry.color }} 
                            />
                            <span>{entry.name}:</span>
                            <span className="font-bold">{formatNumber(entry.value as number)} km/l</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend content={renderLegend} />
            {groups.map((grupo, index) => {
              const color = getGroupColor(grupo, index);
              const isActive = activeGroups.has(grupo);
              return (
                <Line
                  key={grupo}
                  type="monotone"
                  dataKey={grupo}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 4, fill: color }}
                  name={grupo}
                  hide={!isActive}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
