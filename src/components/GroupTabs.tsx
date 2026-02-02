import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProcessedFleetData } from "@/types/fleet";
import { calculateFleetStats, getVehicleRanking, formatNumber, formatKm } from "@/utils/fleetUtils";
import { StatCard } from "./StatCard";
import { Gauge, Route, Truck, Award, AlertTriangle, Layers, Trophy, TrendingDown, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

interface GroupTabsProps {
  data: ProcessedFleetData[];
}

export function GroupTabs({ data }: GroupTabsProps) {
  const groups = useMemo(() => {
    const uniqueGroups = [...new Set(data.map((d) => d.Grupo))].sort();
    return uniqueGroups;
  }, [data]);

  const groupData = useMemo(() => {
    const result: Record<string, ProcessedFleetData[]> = {};
    groups.forEach((grupo) => {
      result[grupo] = data.filter((d) => d.Grupo === grupo);
    });
    return result;
  }, [data, groups]);

  const groupRankings = useMemo(() => {
    const result: Record<string, { top: ProcessedFleetData[]; worst: ProcessedFleetData[] }> = {};
    groups.forEach((grupo) => {
      const ranking = getVehicleRanking(groupData[grupo]);
      const totalVehicles = ranking.length;
      const maxDisplay = Math.min(5, Math.floor(totalVehicles / 2));
      result[grupo] = {
        top: ranking.slice(0, maxDisplay),
        worst: ranking.slice(-maxDisplay).reverse(),
      };
    });
    return result;
  }, [groups, groupData]);

  // Get monthly best/worst vehicles per group
  const monthlyBestWorst = useMemo(() => {
    const result: Record<string, { mes: string; vehicleCount: number; best1: string; best1Value: number; best2: string; best2Value: number; worst1: string; worst1Value: number; worst2: string; worst2Value: number }[]> = {};
    
    groups.forEach((grupo) => {
      const gData = groupData[grupo];
      // Sort months from oldest to most recent (left to right on chart)
      const months = [...new Set(gData.map((d) => d.Mês))].sort((a, b) => {
        const [mesA, anoA] = a.split("/");
        const [mesB, anoB] = b.split("/");
        return anoA.localeCompare(anoB) || mesA.localeCompare(mesB);
      });

      result[grupo] = months.map((mes) => {
        const monthData = gData.filter((d) => d.Mês === mes);
        
        // Group by vehicle and calculate average
        const vehicleAverages = new Map<string, { total: number; count: number }>();
        monthData.forEach((item) => {
          const existing = vehicleAverages.get(item.Veículo);
          if (existing) {
            existing.total += item.mediaCarregadoNum;
            existing.count += 1;
          } else {
            vehicleAverages.set(item.Veículo, { total: item.mediaCarregadoNum, count: 1 });
          }
        });

        const sorted = Array.from(vehicleAverages.entries())
          .map(([vehicle, stats]) => ({ vehicle, avg: stats.total / stats.count }))
          .sort((a, b) => b.avg - a.avg);

        const vehicleCount = sorted.length;
        
        // Handle cases with only 1 vehicle
        if (vehicleCount === 1) {
          return {
            mes,
            vehicleCount,
            best1: sorted[0]?.vehicle || "-",
            best1Value: sorted[0]?.avg || 0,
            best2: "",
            best2Value: 0,
            worst1: "",
            worst1Value: 0,
            worst2: "",
            worst2Value: 0,
          };
        }
        
        // Handle cases with 2 vehicles
        if (vehicleCount === 2) {
          return {
            mes,
            vehicleCount,
            best1: sorted[0]?.vehicle || "-",
            best1Value: sorted[0]?.avg || 0,
            best2: "",
            best2Value: 0,
            worst1: sorted[1]?.vehicle || "-",
            worst1Value: sorted[1]?.avg || 0,
            worst2: "",
            worst2Value: 0,
          };
        }
        
        // Handle cases with 3 vehicles
        if (vehicleCount === 3) {
          return {
            mes,
            vehicleCount,
            best1: sorted[0]?.vehicle || "-",
            best1Value: sorted[0]?.avg || 0,
            best2: "",
            best2Value: 0,
            worst1: sorted[2]?.vehicle || "-",
            worst1Value: sorted[2]?.avg || 0,
            worst2: "",
            worst2Value: 0,
          };
        }

        const best = sorted.slice(0, 2);
        const worst = sorted.slice(-2).reverse();

        return {
          mes,
          vehicleCount,
          best1: best[0]?.vehicle || "-",
          best1Value: best[0]?.avg || 0,
          best2: best[1]?.vehicle || "-",
          best2Value: best[1]?.avg || 0,
          worst1: worst[0]?.vehicle || "-",
          worst1Value: worst[0]?.avg || 0,
          worst2: worst[1]?.vehicle || "-",
          worst2Value: worst[1]?.avg || 0,
        };
      });
    });
    return result;
  }, [groups, groupData]);

  if (groups.length === 0) return null;

  const MonthlyTable = ({ grupo, monthlyData }: { grupo: string; monthlyData: typeof monthlyBestWorst[string] }) => {
    const [showAll, setShowAll] = useState(false);
    const reversedData = [...monthlyData].reverse();
    const displayData = showAll ? reversedData : reversedData.slice(0, 4);
    const hasMore = reversedData.length > 4;

    return (
      <div className="mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {displayData.map((month) => (
            <div key={month.mes} className="bg-background/50 rounded-lg p-2">
              <div className="font-medium text-foreground mb-1">{month.mes}</div>
              {month.vehicleCount === 1 ? (
                <>
                  <div style={{ color: "#22c55e" }}><span className="font-semibold">M1</span> {month.best1}</div>
                  <div className="text-muted-foreground italic">Apenas 1 veículo disponível</div>
                </>
              ) : month.vehicleCount <= 3 ? (
                <>
                  <div style={{ color: "#22c55e" }}><span className="font-semibold">M1</span> {month.best1}</div>
                  <div style={{ color: "#f97316" }}><span className="font-semibold">P1</span> {month.worst1}</div>
                  <div className="text-muted-foreground italic">Apenas {month.vehicleCount} veículos</div>
                </>
              ) : (
                <>
                  <div style={{ color: "#22c55e" }}><span className="font-semibold">M1</span> {month.best1}</div>
                  <div style={{ color: "#3b82f6" }}><span className="font-semibold">M2</span> {month.best2}</div>
                  <div style={{ color: "#f97316" }}><span className="font-semibold">P1</span> {month.worst1}</div>
                  <div style={{ color: "#ef4444" }}><span className="font-semibold">P2</span> {month.worst2}</div>
                </>
              )}
            </div>
          ))}
        </div>
        {hasMore && (
          <div className="flex justify-center mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-muted-foreground hover:text-foreground"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Mostrar menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Mostrar mais ({reversedData.length - 4} meses)
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "350ms" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-chart-4/20 flex items-center justify-center">
          <Layers className="w-5 h-5 text-chart-4" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Métricas por Grupo</h3>
          <p className="text-sm text-muted-foreground">Visualize o desempenho individual de cada grupo</p>
        </div>
      </div>

      <Tabs defaultValue={groups[0]} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-2 bg-secondary/50 p-2 rounded-xl mb-6">
          {groups.map((grupo) => (
            <TabsTrigger
              key={grupo}
              value={grupo}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2"
            >
              {grupo}
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map((grupo) => {
          const stats = calculateFleetStats(groupData[grupo]);
          const { top, worst } = groupRankings[grupo];
          const topMax = top[0]?.mediaCarregadoNum || 1;
          const worstMax = worst[0]?.mediaCarregadoNum || 1;

          return (
            <TabsContent key={grupo} value={grupo} className="mt-0 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard
                  title="Média Carregado"
                  value={formatNumber(stats.avgMediaCarregado) + " km/l"}
                  subtitle="Média do grupo"
                  icon={Gauge}
                  highlight
                  delay={0}
                />
                <StatCard
                  title="KM Rodado"
                  value={formatKm(stats.totalKmRodado)}
                  subtitle="Total do grupo"
                  icon={Route}
                  delay={50}
                />
                <StatCard
                  title="KM Carregado"
                  value={formatKm(stats.totalKmCarregado)}
                  subtitle="Total carregado"
                  icon={Truck}
                  delay={100}
                />
                <StatCard
                  title="Melhor"
                  value={stats.bestVehicle ? formatNumber(stats.bestVehicle.mediaCarregadoNum) : "-"}
                  subtitle={stats.bestVehicle?.Veículo || "-"}
                  icon={Award}
                  delay={150}
                />
                <StatCard
                  title="Pior"
                  value={stats.worstVehicle ? formatNumber(stats.worstVehicle.mediaCarregadoNum) : "-"}
                  subtitle={stats.worstVehicle?.Veículo || "-"}
                  icon={AlertTriangle}
                  delay={200}
                />
              </div>

              {/* Monthly Best/Worst Chart */}
              <div className="bg-secondary/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-chart-1" />
                  <span className="font-medium text-sm">Melhores e Piores por Mês</span>
                  <span className="text-xs text-muted-foreground ml-2">(Verifique se são os mesmos ao longo do tempo)</span>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyBestWorst[grupo]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                      <YAxis 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickFormatter={(value) => value.toFixed(2)}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length > 0) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }} />
                                    <span>Melhor 1: <strong>{data.best1}</strong> - {formatNumber(data.best1Value)} km/l</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3b82f6" }} />
                                    <span>Melhor 2: <strong>{data.best2}</strong> - {formatNumber(data.best2Value)} km/l</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f97316" }} />
                                    <span>Pior 1: <strong>{data.worst1}</strong> - {formatNumber(data.worst1Value)} km/l</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
                                    <span>Pior 2: <strong>{data.worst2}</strong> - {formatNumber(data.worst2Value)} km/l</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        formatter={(value) => {
                          const labels: Record<string, string> = {
                            best1Value: "Melhor 1",
                            best2Value: "Melhor 2",
                            worst1Value: "Pior 1",
                            worst2Value: "Pior 2"
                          };
                          return labels[value] || value;
                        }}
                      />
                      <Line type="monotone" dataKey="best1Value" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="best1Value" />
                      <Line type="monotone" dataKey="best2Value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="best2Value" />
                      <Line type="monotone" dataKey="worst2Value" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="worst2Value" />
                      <Line type="monotone" dataKey="worst1Value" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} name="worst1Value" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <MonthlyTable grupo={grupo} monthlyData={monthlyBestWorst[grupo]} />
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
