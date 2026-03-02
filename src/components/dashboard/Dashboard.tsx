"use client";

import { useMemo, useState } from "react";
import {
  Gauge, Route, Truck, TrendingUp, TrendingDown, Trophy,
  AlertTriangle, AlertOctagon, Target, GitCompare, Layers,
  TruckIcon, ChevronRight, ChevronDown, ChevronUp, Minus,
  Search, X, ChevronsUpDown, Check, Calendar, Filter, Settings,
  FileSpreadsheet, Download, Printer
} from "lucide-react";
import { ProcessedFleetData } from "@/types/fleet";
import {
  calculateFleetStats, getVehicleRanking, getGroupStats,
  getMonthlyTrend, getModelStats, formatNumber, formatKm
} from "@/utils/fleetUtils";
import {
  calculateLoadEfficiency, detectAnomalies, calculateModelBenchmark,
  calculateTrends, generateAttentionReport,
  type LoadEfficiencyData, type AnomalyData, type ModelBenchmark,
  type TrendData, type AttentionVehicle
} from "@/utils/analysisUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ReferenceLine
} from "recharts";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

/* ========================================================================
   VISIBILITY SETTINGS
   ======================================================================== */

interface DashboardVisibility {
  mainStats: boolean;
  globalFilters: boolean;
  monthlyTrend: boolean;
  attentionReport: boolean;
  loadEfficiency: boolean;
  anomalyDetector: boolean;
  vehicleComparator: boolean;
  modelBenchmark: boolean;
  trendIndicator: boolean;
  groupChart: boolean;
  groupTabs: boolean;
  vehiclePerformance: boolean;
  vehicleRanking: boolean;
  modelRanking: boolean;
  dataTable: boolean;
}

const defaultVisibility: DashboardVisibility = {
  mainStats: true,
  globalFilters: true,
  monthlyTrend: true,
  attentionReport: true,
  loadEfficiency: true,
  anomalyDetector: true,
  vehicleComparator: true,
  modelBenchmark: true,
  trendIndicator: true,
  groupChart: true,
  groupTabs: true,
  vehiclePerformance: true,
  vehicleRanking: true,
  modelRanking: true,
  dataTable: false,
};

const sectionLabels: Record<keyof DashboardVisibility, string> = {
  mainStats: "Estatísticas Principais",
  globalFilters: "Filtros e Exportação",
  monthlyTrend: "Tendência Mensal",
  attentionReport: "Relatório de Atenção",
  loadEfficiency: "Eficiência de Carga",
  anomalyDetector: "Detector de Anomalias",
  vehicleComparator: "Comparador de Veículos",
  modelBenchmark: "Benchmark por Modelo",
  trendIndicator: "Indicadores de Tendência",
  groupChart: "Desempenho por Grupo",
  groupTabs: "Métricas por Grupo",
  vehiclePerformance: "Desempenho Individual",
  vehicleRanking: "Ranking de Veículos",
  modelRanking: "Ranking de Modelos",
  dataTable: "Tabela de Dados",
};

function useDashboardVisibility() {
  const [visibility, setVisibility] = useState<DashboardVisibility>(() => {
    if (typeof window === "undefined") return defaultVisibility;
    const stored = localStorage.getItem("dashboard-visibility-v2");
    if (stored) {
      try { return { ...defaultVisibility, ...JSON.parse(stored) }; }
      catch { return defaultVisibility; }
    }
    return defaultVisibility;
  });

  const toggleSection = (section: keyof DashboardVisibility) => {
    setVisibility((prev) => {
      const next = { ...prev, [section]: !prev[section] };
      localStorage.setItem("dashboard-visibility-v2", JSON.stringify(next));
      return next;
    });
  };

  const resetToDefault = () => {
    setVisibility(defaultVisibility);
    localStorage.setItem("dashboard-visibility-v2", JSON.stringify(defaultVisibility));
  };

  return { visibility, toggleSection, resetToDefault };
}

/* ========================================================================
   BENTO STAT CARD
   ======================================================================== */

function BentoStatCard({
  title, value, subtitle, icon: Icon, variant = "default", className
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  variant?: "default" | "highlight" | "success" | "warning" | "destructive";
  className?: string;
}) {
  const variantStyles = {
    default: "bg-card border-border",
    highlight: "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20",
    success: "bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border-accent/20",
    warning: "bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border-warning/20",
    destructive: "bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border-destructive/20",
  };

  const iconStyles = {
    default: "bg-muted text-muted-foreground",
    highlight: "bg-primary/15 text-primary",
    success: "bg-accent/15 text-accent",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/15 text-destructive",
  };

  return (
    <Card className={cn(
      "border transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn(
              "text-3xl font-black tracking-tight",
              variant === "highlight" && "text-primary",
              variant === "success" && "text-accent",
              variant === "warning" && "text-warning",
              variant === "destructive" && "text-destructive",
            )}>{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn("rounded-xl p-2.5", iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ========================================================================
   GLOBAL FILTERS
   ======================================================================== */

function GlobalFilters({ data, onFilterChange }: {
  data: ProcessedFleetData[];
  onFilterChange: (filtered: ProcessedFleetData[]) => void;
}) {
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [periodPreset, setPeriodPreset] = useState("");

  const months = useMemo(() => {
    const s = new Set<string>();
    data.forEach((d) => s.add(d.Mês));
    return Array.from(s).sort((a, b) => {
      const [mA, yA] = a.split("/");
      const [mB, yB] = b.split("/");
      return yA.localeCompare(yB) || mA.localeCompare(mB);
    });
  }, [data]);

  const applyFilters = (start: string, end: string) => {
    let filtered = [...data];
    if (start || end) {
      filtered = filtered.filter((item) => {
        const [m, y] = item.Mês.split("/");
        const d = new Date(parseInt(`20${y}`), parseInt(m) - 1, 1);
        if (start) {
          const [sm, sy] = start.split("/");
          if (d < new Date(parseInt(`20${sy}`), parseInt(sm) - 1, 1)) return false;
        }
        if (end) {
          const [em, ey] = end.split("/");
          if (d > new Date(parseInt(`20${ey}`), parseInt(em) - 1, 1)) return false;
        }
        return true;
      });
    }
    onFilterChange(filtered);
  };

  const handlePreset = (preset: string) => {
    setPeriodPreset(preset);
    const sorted = [...months];
    if (!sorted.length) return;
    let start = "";
    const end = sorted[sorted.length - 1];
    switch (preset) {
      case "3m": start = sorted[Math.max(0, sorted.length - 3)]; break;
      case "6m": start = sorted[Math.max(0, sorted.length - 6)]; break;
      case "12m": start = sorted[Math.max(0, sorted.length - 12)]; break;
      case "all": start = ""; break;
    }
    setStartMonth(start);
    setEndMonth(preset === "all" ? "" : end);
    applyFilters(start, preset === "all" ? "" : end);
  };

  const clearFilters = () => {
    setStartMonth("");
    setEndMonth("");
    setPeriodPreset("");
    onFilterChange(data);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Período:</span>
      </div>
      <div className="flex items-center gap-1">
        {[
          { value: "3m", label: "3M" },
          { value: "6m", label: "6M" },
          { value: "12m", label: "12M" },
          { value: "all", label: "Tudo" },
        ].map((p) => (
          <Button
            key={p.value}
            variant={periodPreset === p.value ? "default" : "secondary"}
            size="sm"
            onClick={() => handlePreset(p.value)}
            className="h-7 text-xs rounded-lg"
          >
            {p.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <select
          value={startMonth}
          onChange={(e) => {
            setStartMonth(e.target.value);
            setPeriodPreset("");
            applyFilters(e.target.value, endMonth);
          }}
          className="h-7 rounded-lg bg-secondary border-none px-2 text-xs focus:ring-2 focus:ring-primary"
        >
          <option value="">De...</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="text-muted-foreground">até</span>
        <select
          value={endMonth}
          onChange={(e) => {
            setEndMonth(e.target.value);
            setPeriodPreset("");
            applyFilters(startMonth, e.target.value);
          }}
          className="h-7 rounded-lg bg-secondary border-none px-2 text-xs focus:ring-2 focus:ring-primary"
        >
          <option value="">Até...</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      {(startMonth || endMonth) && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-destructive">
          <X className="h-3 w-3 mr-1" /> Limpar
        </Button>
      )}
    </div>
  );
}

/* ========================================================================
   MONTHLY TREND CHART
   ======================================================================== */

function MonthlyTrendCard({ data }: { data: { mes: string; mediaCarregado: number; kmTotal: number }[] }) {
  return (
    <Card className="border-border/50 col-span-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Tendência Mensal</CardTitle>
            <CardDescription>Evolução da média carregado ao longo do tempo</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 20 }}>
              <defs>
                <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
              <YAxis
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                domain={["dataMin - 0.5", "dataMax + 0.5"]}
                tickFormatter={(v: number) => v.toFixed(2)}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                }}
                formatter={(value: number | string | undefined) => [Number(value ?? 0).toFixed(2) + " km/l", "Média Carregado"]}
              />
              <Area type="monotone" dataKey="mediaCarregado" stroke="var(--color-chart-2)" strokeWidth={3} fill="url(#colorTrend)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ========================================================================
   ATTENTION REPORT
   ======================================================================== */

function AttentionReportCard({ data }: { data: AttentionVehicle[] }) {
  const alta = data.filter((d) => d.prioridade === "alta");
  const media = data.filter((d) => d.prioridade === "media");

  return (
    <Card className="border-border/50 col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-destructive/10 p-2.5">
              <AlertOctagon className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg">Relatório de Atenção</CardTitle>
              <CardDescription>Veículos que precisam de atenção</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            {alta.length > 0 && <Badge variant="destructive">{alta.length} alta</Badge>}
            {media.length > 0 && <Badge className="bg-warning text-warning-foreground">{media.length} média</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3 pr-4">
              {data.slice(0, 15).map((v) => (
                <div key={v.veiculo} className={cn(
                  "rounded-xl border p-4 transition-colors",
                  v.prioridade === "alta" && "bg-destructive/5 border-destructive/20",
                  v.prioridade === "media" && "bg-warning/5 border-warning/20",
                  v.prioridade === "baixa" && "bg-muted/50 border-border",
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "mt-1.5 h-2 w-2 rounded-full shrink-0",
                      v.prioridade === "alta" && "bg-destructive",
                      v.prioridade === "media" && "bg-warning",
                      v.prioridade === "baixa" && "bg-muted-foreground",
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold truncate">{v.veiculo}</span>
                        <Badge variant="outline" className={cn(
                          "shrink-0 text-[10px]",
                          v.prioridade === "alta" && "border-destructive/30 text-destructive",
                          v.prioridade === "media" && "border-warning/30 text-warning",
                        )}>
                          {v.prioridade}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{v.marca} • {v.modelo} • {v.grupo}</p>
                      <div className="space-y-1">
                        {v.problemas.map((p, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertOctagon className="h-12 w-12 mb-2 opacity-30" />
            <p className="font-medium">Todos os veículos estão bem!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ========================================================================
   LOAD EFFICIENCY CARD
   ======================================================================== */

function LoadEfficiencyBento({ data }: { data: LoadEfficiencyData[] }) {
  const low = data.filter((d) => d.eficiencia < 75);
  const avg = data.reduce((s, d) => s + d.eficiencia, 0) / data.length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-warning/10 p-2.5">
              <TruckIcon className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg">Eficiência de Carga</CardTitle>
              <CardDescription>KM carregado vs KM total</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">{formatNumber(avg, 1)}%</p>
            <p className="text-xs text-muted-foreground">Média da frota</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {low.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-3 rounded-lg bg-warning/10 p-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm text-warning font-medium">
                {low.length} veículos abaixo de 75%
              </span>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-4">
                {low.slice(0, 10).map((v, i) => (
                  <div key={v.veiculo} className="flex items-center justify-between rounded-lg bg-muted/50 p-3 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}</span>
                      <div>
                        <p className="font-medium text-sm">{v.veiculo}</p>
                        <p className="text-xs text-muted-foreground">{v.marca} • {v.modelo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-destructive">{formatNumber(v.eficiencia, 1)}%</p>
                      <p className="text-[10px] text-muted-foreground">{formatNumber(v.kmVazio, 0)} km vazio</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <TruckIcon className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Todos com boa eficiência!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ========================================================================
   ANOMALY DETECTOR
   ======================================================================== */

function AnomalyDetectorCard({ data }: { data: AnomalyData[] }) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-destructive/10 p-2.5">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-lg">Anomalias</CardTitle>
              <CardDescription>Quedas bruscas de performance</CardDescription>
            </div>
          </div>
          {data.length > 0 && (
            <Badge variant="destructive">{data.length} alertas</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ScrollArea className="h-[240px]">
            <div className="space-y-3 pr-4">
              {data.map((a) => (
                <div key={a.veiculo} className="rounded-xl bg-destructive/5 border border-destructive/20 p-4">
                  <div className="flex items-start gap-3">
                    <TrendingDown className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{a.veiculo}</span>
                        <Badge variant="destructive" className="text-[10px] h-5">
                          {formatNumber(a.variacao, 0)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{a.marca} • {a.modelo}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground">
                          Histórico: <strong>{formatNumber(a.mediaHistorica, 2)} km/l</strong>
                        </span>
                        <span className="text-destructive">
                          {a.mesAtual}: <strong>{formatNumber(a.valorAtual, 2)} km/l</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Nenhuma anomalia detectada!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ========================================================================
   VEHICLE COMPARATOR
   ======================================================================== */

const COMPARE_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

function VehicleComparatorCard({ data }: { data: ProcessedFleetData[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const vehicles = useMemo(() => {
    const m = new Map<string, { marca: string; modelo: string; grupo: string }>();
    data.forEach((d) => {
      if (!m.has(d.Veículo)) m.set(d.Veículo, { marca: d.Marca, modelo: d.Modelo, grupo: d.Grupo });
    });
    return Array.from(m.entries()).map(([v, info]) => ({ veiculo: v, ...info })).sort((a, b) => a.veiculo.localeCompare(b.veiculo));
  }, [data]);

  const chartData = useMemo(() => {
    if (!selected.length) return [];
    const meses = new Set<string>();
    data.forEach((d) => meses.add(d.Mês));
    return Array.from(meses).sort((a, b) => {
      const [mA, yA] = a.split("/");
      const [mB, yB] = b.split("/");
      return yA.localeCompare(yB) || mA.localeCompare(mB);
    }).map((mes) => {
      const p: Record<string, string | number> = { mes };
      selected.forEach((v) => {
        const r = data.find((d) => d.Veículo === v && d.Mês === mes);
        p[v] = r ? r.mediaCarregadoNum : 0;
      });
      return p;
    });
  }, [data, selected]);

  return (
    <Card className="border-border/50 col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <GitCompare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Comparador de Veículos</CardTitle>
            <CardDescription>Compare até 5 veículos lado a lado</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="text-sm text-muted-foreground">
                  {selected.length === 0 ? "Selecione veículos..." : `${selected.length} selecionado(s)`}
                </span>
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar veículo..." />
                <CommandList>
                  <CommandEmpty>Nenhum veículo encontrado.</CommandEmpty>
                  <CommandGroup>
                    {vehicles.map((v) => (
                      <CommandItem key={v.veiculo} value={v.veiculo} onSelect={() => {
                        setSelected((prev) =>
                          prev.includes(v.veiculo) ? prev.filter((x) => x !== v.veiculo) : prev.length >= 5 ? prev : [...prev, v.veiculo]
                        );
                      }}>
                        <Check className={cn("mr-2 h-4 w-4", selected.includes(v.veiculo) ? "opacity-100" : "opacity-0")} />
                        <span className="font-medium">{v.veiculo}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{v.marca}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selected.map((v, i) => (
              <Badge key={v} variant="outline" className="gap-1 pr-1" style={{ borderColor: COMPARE_COLORS[i], color: COMPARE_COLORS[i] }}>
                {v}
                <button onClick={() => setSelected((prev) => prev.filter((x) => x !== v))} className="ml-1 hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {selected.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} tickFormatter={(v) => v.toFixed(1)} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: "12px" }}
                  formatter={(value: number | string | undefined) => [formatNumber(Number(value ?? 0), 2) + " km/l"]}
                />
                <Legend />
                {selected.map((v, i) => (
                  <Line key={v} type="monotone" dataKey={v} stroke={COMPARE_COLORS[i]} strokeWidth={2} dot={{ fill: COMPARE_COLORS[i] }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <GitCompare className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Selecione veículos para comparar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ========================================================================
   MODEL BENCHMARK
   ======================================================================== */

function ModelBenchmarkBento({ data }: { data: ModelBenchmark[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const total = data.reduce((s, m) => s + m.veiculosAbaixo.length, 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-accent/10 p-2.5">
              <Target className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">Benchmark</CardTitle>
              <CardDescription>Veículos abaixo da média do modelo</CardDescription>
            </div>
          </div>
          {total > 0 && <Badge className="bg-warning text-warning-foreground">{total} abaixo</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ScrollArea className="h-[280px]">
            <div className="space-y-2 pr-4">
              {data.map((m) => (
                <div key={m.modelo} className="rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpanded((prev) => {
                      const n = new Set(prev);
                      n.has(m.modelo) ? n.delete(m.modelo) : n.add(m.modelo);
                      return n;
                    })}
                    className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-sm text-left">{m.modelo}</p>
                      <p className="text-xs text-muted-foreground">{m.marca}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatNumber(m.mediaBenchmark, 2)} km/l</span>
                      {expanded.has(m.modelo) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>
                  {expanded.has(m.modelo) && (
                    <div className="p-2 space-y-1">
                      {m.veiculosAbaixo.map((v) => (
                        <div key={v.veiculo} className="flex items-center justify-between rounded-lg bg-muted/30 p-2 text-sm">
                          <span className="font-medium">{v.veiculo}</span>
                          <div className="flex items-center gap-2">
                            <span>{formatNumber(v.media, 2)} km/l</span>
                            <span className="text-xs text-destructive">({formatNumber(v.diferenca, 2)})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Target className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Todos atingem o benchmark!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ========================================================================
   TREND INDICATOR
   ======================================================================== */

function TrendIndicatorCard({ data }: { data: TrendData[] }) {
  const improving = data.filter((d) => d.tendencia === "up");
  const declining = data.filter((d) => d.tendencia === "down");

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-accent/10 p-2.5">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg">Tendências</CardTitle>
            <CardDescription>Mês atual vs últimos 3 meses</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-accent/10 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span className="text-2xl font-black text-accent">{improving.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Melhorando</p>
          </div>
          <div className="rounded-xl bg-destructive/10 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-2xl font-black text-destructive">{declining.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Piorando</p>
          </div>
        </div>
        <ScrollArea className="h-[200px]">
          <div className="space-y-2 pr-4">
            {data.slice(0, 15).map((v) => (
              <div key={v.veiculo} className="flex items-center justify-between rounded-lg bg-muted/50 p-3 hover:bg-muted transition-colors">
                <div className="flex items-center gap-2">
                  {v.tendencia === "up" && <TrendingUp className="h-4 w-4 text-accent" />}
                  {v.tendencia === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
                  {v.tendencia === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <p className="font-medium text-sm">{v.veiculo}</p>
                    <p className="text-[10px] text-muted-foreground">{v.marca}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-bold text-sm",
                    v.tendencia === "up" && "text-accent",
                    v.tendencia === "down" && "text-destructive",
                    v.tendencia === "stable" && "text-muted-foreground",
                  )}>
                    {v.variacao > 0 ? "+" : ""}{formatNumber(v.variacao, 1)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">{formatNumber(v.mediaAtual, 2)} km/l</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/* ========================================================================
   GROUP CHART
   ======================================================================== */

const GROUP_COLORS: Record<string, string> = {
  "FRANGO": "#10b981", "SUINO": "#3b82f6", "CONFINAMENTO": "#f59e0b",
  "AVES": "#8b5cf6", "BOVINO": "#ef4444",
};
const FALLBACK_COLORS = ["#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1", "#14b8a6", "#a855f7", "#f43f5e", "#22c55e", "#eab308"];

function GroupChartCard({ data }: { data: ProcessedFleetData[] }) {
  const groups = useMemo(() => [...new Set(data.map((d) => d.Grupo))].sort(), [data]);
  const [active, setActive] = useState<Set<string>>(() => new Set(groups.slice(0, 5)));

  const chartData = useMemo(() => {
    const months = [...new Set(data.map((d) => d.Mês))].sort((a, b) => {
      const [mA, yA] = a.split("/"); const [mB, yB] = b.split("/");
      return yA.localeCompare(yB) || mA.localeCompare(mB);
    });
    return months.map((mes) => {
      const md = data.filter((d) => d.Mês === mes);
      const r: Record<string, string | number> = { mes };
      groups.forEach((g) => {
        const gd = md.filter((d) => d.Grupo === g);
        if (gd.length) r[g] = gd.reduce((s, d) => s + d.mediaCarregadoNum, 0) / gd.length;
      });
      return r;
    });
  }, [data, groups]);

  const getColor = (g: string, i: number) => GROUP_COLORS[g] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];

  return (
    <Card className="border-border/50 col-span-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-chart-4/15 p-2.5">
              <Layers className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Desempenho por Grupo</CardTitle>
              <CardDescription>Média carregado por grupo ao longo do tempo</CardDescription>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{active.size}/{groups.length} grupos</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {groups.map((g, i) => {
            const c = getColor(g, i);
            const isActive = active.has(g);
            return (
              <button key={g}
                onClick={() => setActive((prev) => { const n = new Set(prev); n.has(g) ? n.delete(g) : n.add(g); return n; })}
                className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                  isActive ? "opacity-100" : "opacity-40 hover:opacity-60")}
                style={{ borderColor: c, color: c, backgroundColor: isActive ? `${c}15` : "transparent" }}
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c }} />
                {g}
              </button>
            );
          })}
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="mes" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} tickFormatter={(v) => v.toFixed(2)} domain={["auto", "auto"]} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px" }}
                content={({ active: isActive, payload, label }) => {
                  if (isActive && payload?.length) {
                    const sorted = [...payload].sort((a, b) => (b.value as number) - (a.value as number));
                    return (
                      <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
                        <p className="font-medium mb-2 text-sm">{label}</p>
                        <div className="space-y-1">
                          {sorted.map((e, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                              <span>{e.name}:</span>
                              <span className="font-bold">{formatNumber(e.value as number)} km/l</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {groups.map((g, i) => (
                <Line key={g} type="monotone" dataKey={g} stroke={getColor(g, i)} strokeWidth={2}
                  dot={{ r: 3, fill: getColor(g, i) }} hide={!active.has(g)} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ========================================================================
   VEHICLE PERFORMANCE (Individual)
   ======================================================================== */

function VehiclePerformanceCard({ data }: { data: ProcessedFleetData[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const vehicles = useMemo(() => {
    const m = new Map<string, { marca: string; modelo: string; grupo: string }>();
    data.forEach((d) => { if (!m.has(d.Veículo)) m.set(d.Veículo, { marca: d.Marca, modelo: d.Modelo, grupo: d.Grupo }); });
    return Array.from(m.entries()).map(([v, info]) => ({ veiculo: v, ...info })).sort((a, b) => a.veiculo.localeCompare(b.veiculo));
  }, [data]);

  const vehicleData = useMemo(() => {
    if (!selected) return [];
    return data.filter((d) => d.Veículo === selected)
      .map((d) => ({ mes: d.Mês, mediaCarregado: d.mediaCarregadoNum, kmRodado: d["KM Rodado"], kmCarregado: d["KM Rodado Carregado"] }))
      .sort((a, b) => {
        const [mA, yA] = a.mes.split("/"); const [mB, yB] = b.mes.split("/");
        return yA.localeCompare(yB) || mA.localeCompare(mB);
      });
  }, [data, selected]);

  const avg = useMemo(() => vehicleData.length ? vehicleData.reduce((s, d) => s + d.mediaCarregado, 0) / vehicleData.length : 0, [vehicleData]);
  const info = vehicles.find((v) => v.veiculo === selected);

  return (
    <Card className="border-border/50 col-span-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Desempenho Individual</CardTitle>
              <CardDescription>Evolução de um veículo específico</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-between">
                  {selected || "Selecione um veículo"}
                  <Search className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="end">
                <Command>
                  <CommandInput placeholder="Buscar veículo..." />
                  <CommandList>
                    <CommandEmpty>Nenhum veículo encontrado.</CommandEmpty>
                    <CommandGroup>
                      {vehicles.map((v) => (
                        <CommandItem key={v.veiculo} value={v.veiculo} onSelect={(val) => { setSelected(val === selected ? null : val); setOpen(false); }}>
                          <span className="font-medium">{v.veiculo}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{v.grupo}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selected && <Button variant="ghost" size="icon" onClick={() => setSelected(null)} className="h-9 w-9"><X className="h-4 w-4" /></Button>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selected && info ? (
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{selected}</span>
                  <Badge variant="secondary">{info.grupo}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{info.marca} • {info.modelo}</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-black text-primary">{formatNumber(avg)}</p>
                  <p className="text-xs text-muted-foreground">Média km/l</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black">{vehicleData.length}</p>
                  <p className="text-xs text-muted-foreground">Meses</p>
                </div>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vehicleData} margin={{ left: 0, right: 20, top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} domain={["dataMin - 0.3", "dataMax + 0.3"]} tickFormatter={(v: number) => v.toFixed(2)} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "12px" }}
                    content={({ active: isActive, payload, label }) => {
                      if (isActive && payload?.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
                            <p className="font-medium mb-2">{label}</p>
                            <p>Média: <strong className="text-primary">{formatNumber(d.mediaCarregado)} km/l</strong></p>
                            <p className="text-muted-foreground">KM Rodado: {d.kmRodado.toLocaleString("pt-BR")}</p>
                            <p className="text-muted-foreground">KM Carregado: {d.kmCarregado.toLocaleString("pt-BR")}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={avg} stroke="var(--color-muted-foreground)" strokeDasharray="5 5"
                    label={{ value: `Média: ${formatNumber(avg)}`, position: "right", fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  />
                  <Line type="monotone" dataKey="mediaCarregado" stroke="var(--color-primary)" strokeWidth={3}
                    dot={{ r: 5, fill: "var(--color-primary)", strokeWidth: 2, stroke: "var(--color-background)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Search className="h-10 w-10 mb-2 opacity-30" />
            <p className="font-medium">Selecione um veículo</p>
            <p className="text-sm">Escolha para visualizar o desempenho</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ========================================================================
   VEHICLE RANKING
   ======================================================================== */

function VehicleRankingCard({ vehicles }: { vehicles: ProcessedFleetData[] }) {
  const avg = vehicles.reduce((s, v) => s + v.mediaCarregadoNum, 0) / vehicles.length;

  return (
    <Card className="border-border/50 col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-warning/10 p-2.5">
            <Trophy className="h-5 w-5 text-warning" />
          </div>
          <div>
            <CardTitle className="text-lg">Ranking de Veículos</CardTitle>
            <CardDescription>Top 10 por média carregado (km/l)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {vehicles.slice(0, 10).map((v, i) => {
            const above = v.mediaCarregadoNum >= avg;
            return (
              <div key={v.Veículo} className={cn(
                "flex flex-col items-center gap-2 rounded-xl p-4 min-w-[130px] shrink-0 border transition-all",
                i === 0 ? "bg-gradient-to-b from-warning/10 to-transparent border-warning/30" : "bg-card border-border hover:border-primary/20"
              )}>
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm",
                  i === 0 && "bg-warning text-warning-foreground",
                  i === 1 && "bg-muted",
                  i === 2 && "bg-warning/20 text-warning",
                  i > 2 && "bg-secondary",
                )}>
                  {i + 1}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm truncate max-w-[100px]">{v.Veículo}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[100px]">{v.Marca}</p>
                </div>
                <div className="flex items-center gap-1">
                  {above ? <TrendingUp className="h-3 w-3 text-accent" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                  <span className={cn("font-bold text-sm", above ? "text-accent" : "text-destructive")}>
                    {formatNumber(v.mediaCarregadoNum)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/* ========================================================================
   MODEL RANKING
   ======================================================================== */

function ModelRankingCard({ models }: { models: { modelo: string; marca: string; mediaCarregado: number; count: number }[] }) {
  const top = models.slice(0, 5);
  const worst = models.slice(-5).reverse();
  const topMax = top[0]?.mediaCarregado || 1;
  const worstMax = worst[0]?.mediaCarregado || 1;

  const renderList = (items: typeof top, isTop: boolean, maxVal: number) => (
    <div className="space-y-3">
      {items.map((m, i) => {
        const pct = (m.mediaCarregado / maxVal) * 100;
        return (
          <div key={m.modelo} className="flex items-center gap-3">
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm",
              isTop ? "bg-accent/15 text-accent" : "bg-destructive/15 text-destructive")}>
              {isTop && i === 0 ? <Trophy className="h-4 w-4" /> : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm truncate pr-2">{m.modelo}</span>
                <span className={cn("font-bold text-sm whitespace-nowrap", isTop ? "text-primary" : "text-destructive")}>
                  {formatNumber(m.mediaCarregado)} km/l
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
              <span className="text-[10px] text-muted-foreground">{m.marca}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <Card className="border-border/50 col-span-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Desempenho por Modelo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-4 w-4 text-accent" />
              <span className="font-medium text-sm">5 Melhores</span>
            </div>
            {renderList(top, true, topMax)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="font-medium text-sm">5 Piores</span>
            </div>
            {renderList(worst, false, worstMax)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ========================================================================
   DATA TABLE
   ======================================================================== */

function DataTableCard({ data }: { data: ProcessedFleetData[] }) {
  const [visible, setVisible] = useState(false);

  return (
    <Card className="border-border/50 col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-secondary p-2.5">
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Dados Detalhados</CardTitle>
              <CardDescription>{data.length} registros</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setVisible(!visible)}>
            {visible ? <><ChevronUp className="h-4 w-4 mr-1" /> Ocultar</> : <><ChevronDown className="h-4 w-4 mr-1" /> Mostrar</>}
          </Button>
        </div>
      </CardHeader>
      {visible && (
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-right">KM Rodado</TableHead>
                  <TableHead className="text-right">KM Carregado</TableHead>
                  <TableHead className="text-right">Média</TableHead>
                  <TableHead className="text-right">Média Carreg.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((r, i) => (
                  <TableRow key={`${r.Veículo}-${r.Mês}-${i}`}>
                    <TableCell className="text-xs">{r.Mês}</TableCell>
                    <TableCell className="font-medium text-xs">{r.Veículo}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.Marca}</TableCell>
                    <TableCell className="text-xs">{r.Grupo}</TableCell>
                    <TableCell className="text-right text-xs">{formatKm(r["KM Rodado"])}</TableCell>
                    <TableCell className="text-right text-xs">{formatKm(r["KM Rodado Carregado"])}</TableCell>
                    <TableCell className="text-right text-xs">{formatNumber(r.mediaNum)}</TableCell>
                    <TableCell className="text-right text-xs font-semibold text-accent">{formatNumber(r.mediaCarregadoNum)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}

/* ========================================================================
   GROUP TABS
   ======================================================================== */

function GroupTabsCard({ data }: { data: ProcessedFleetData[] }) {
  const groups = useMemo(() => [...new Set(data.map((d) => d.Grupo))].sort(), [data]);
  const groupData = useMemo(() => {
    const r: Record<string, ProcessedFleetData[]> = {};
    groups.forEach((g) => { r[g] = data.filter((d) => d.Grupo === g); });
    return r;
  }, [data, groups]);

  if (!groups.length) return null;

  return (
    <Card className="border-border/50 col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-chart-4/15 p-2.5">
            <Layers className="h-5 w-5 text-chart-4" />
          </div>
          <div>
            <CardTitle className="text-lg">Métricas por Grupo</CardTitle>
            <CardDescription>Desempenho individual de cada grupo</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={groups[0]}>
          <TabsList className="flex flex-wrap h-auto gap-1 bg-secondary/50 p-1.5 rounded-xl mb-4">
            {groups.map((g) => (
              <TabsTrigger key={g} value={g} className="rounded-lg px-3 py-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {g}
              </TabsTrigger>
            ))}
          </TabsList>
          {groups.map((g) => {
            const stats = calculateFleetStats(groupData[g]);
            return (
              <TabsContent key={g} value={g}>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <BentoStatCard title="Média Carreg." value={formatNumber(stats.avgMediaCarregado) + " km/l"} subtitle="Média do grupo" icon={Gauge} variant="highlight" />
                  <BentoStatCard title="KM Rodado" value={formatKm(stats.totalKmRodado)} subtitle="Total" icon={Route} />
                  <BentoStatCard title="KM Carregado" value={formatKm(stats.totalKmCarregado)} subtitle="Total carreg." icon={Truck} />
                  <BentoStatCard title="Melhor" value={stats.bestVehicle ? formatNumber(stats.bestVehicle.mediaCarregadoNum) : "-"} subtitle={stats.bestVehicle?.Veículo || "-"} icon={Trophy} variant="success" />
                  <BentoStatCard title="Pior" value={stats.worstVehicle ? formatNumber(stats.worstVehicle.mediaCarregadoNum) : "-"} subtitle={stats.worstVehicle?.Veículo || "-"} icon={AlertTriangle} variant="destructive" />
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}

/* ========================================================================
   MAIN DASHBOARD
   ======================================================================== */

interface DashboardProps {
  data: ProcessedFleetData[];
}

export function Dashboard({ data }: DashboardProps) {
  const [filteredData, setFilteredData] = useState<ProcessedFleetData[]>(data);
  const { visibility, toggleSection, resetToDefault } = useDashboardVisibility();

  const activeData = filteredData.length > 0 ? filteredData : data;

  const stats = useMemo(() => calculateFleetStats(activeData), [activeData]);
  const vehicleRanking = useMemo(() => getVehicleRanking(activeData), [activeData]);
  const modelRanking = useMemo(() => getModelStats(activeData), [activeData]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(activeData), [activeData]);
  const loadEfficiency = useMemo(() => calculateLoadEfficiency(activeData), [activeData]);
  const anomalies = useMemo(() => detectAnomalies(activeData), [activeData]);
  const modelBenchmark = useMemo(() => calculateModelBenchmark(activeData), [activeData]);
  const trends = useMemo(() => calculateTrends(activeData), [activeData]);
  const attentionReport = useMemo(() =>
    generateAttentionReport(activeData, loadEfficiency, anomalies, trends),
    [activeData, loadEfficiency, anomalies, trends]
  );

  const visibleCount = Object.values(visibility).filter(Boolean).length;
  const totalCount = Object.keys(visibility).length;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black gradient-text">Comelli Transportes</h1>
                <p className="text-sm text-muted-foreground">
                  Dashboard de Médias • {stats.totalVeiculos} veículos • {activeData.length} registros
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Personalizar</span>
                      <Badge variant="secondary" className="text-[10px] h-5">{visibleCount}/{totalCount}</Badge>
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-[320px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" /> Personalizar Dashboard
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      <p className="text-sm text-muted-foreground">Selecione as seções visíveis:</p>
                      <div className="space-y-2">
                        {(Object.keys(sectionLabels) as Array<keyof DashboardVisibility>).map((s) => (
                          <label key={s} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                            <Checkbox checked={visibility[s]} onCheckedChange={() => toggleSection(s)} />
                            <span className="text-sm font-medium">{sectionLabels[s]}</span>
                          </label>
                        ))}
                      </div>
                      <Button variant="outline" className="w-full" onClick={resetToDefault}>
                        Restaurar Padrão
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Filters */}
            {visibility.globalFilters && (
              <div className="pb-4">
                <GlobalFilters data={data} onFilterChange={setFilteredData} />
              </div>
            )}
          </div>
        </header>

        {/* Bento Grid Content */}
        <main className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Main Stats - Bento row */}
            {visibility.mainStats && (
              <>
                <BentoStatCard
                  title="Média Carregado"
                  value={formatNumber(stats.avgMediaCarregado) + " km/l"}
                  subtitle="Média geral da frota carregada"
                  icon={Gauge}
                  variant="highlight"
                  className="md:col-span-1"
                />
                <BentoStatCard
                  title="KM Total Rodado"
                  value={formatKm(stats.totalKmRodado)}
                  subtitle="Quilometragem total percorrida"
                  icon={Route}
                />
                <BentoStatCard
                  title="KM Carregado"
                  value={formatKm(stats.totalKmCarregado)}
                  subtitle="Quilometragem carregado"
                  icon={Truck}
                />
              </>
            )}

            {/* Monthly Trend - full width */}
            {visibility.monthlyTrend && <MonthlyTrendCard data={monthlyTrend} />}

            {/* Attention Report - full width */}
            {visibility.attentionReport && <AttentionReportCard data={attentionReport} />}

            {/* Load Efficiency + Anomaly Detector - 2 col */}
            {visibility.loadEfficiency && <LoadEfficiencyBento data={loadEfficiency} />}
            {visibility.anomalyDetector && <AnomalyDetectorCard data={anomalies} />}

            {/* Benchmark + Trends - side by side on lg, stacked on smaller */}
            {visibility.modelBenchmark && <ModelBenchmarkBento data={modelBenchmark} />}
            {visibility.trendIndicator && <TrendIndicatorCard data={trends} />}

            {/* Vehicle Comparator - full width */}
            {visibility.vehicleComparator && <VehicleComparatorCard data={activeData} />}

            {/* Group Chart - full width */}
            {visibility.groupChart && <GroupChartCard data={activeData} />}

            {/* Group Tabs - full width */}
            {visibility.groupTabs && <GroupTabsCard data={activeData} />}

            {/* Vehicle Performance - full width */}
            {visibility.vehiclePerformance && <VehiclePerformanceCard data={activeData} />}

            {/* Vehicle Ranking - full width */}
            {visibility.vehicleRanking && <VehicleRankingCard vehicles={vehicleRanking} />}

            {/* Model Ranking - full width */}
            {visibility.modelRanking && <ModelRankingCard models={modelRanking} />}

            {/* Data Table - full width */}
            {visibility.dataTable && <DataTableCard data={activeData} />}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 py-6 mt-8">
          <div className="mx-auto max-w-[1400px] px-4 md:px-6 lg:px-8">
            <p className="text-center text-sm text-muted-foreground">
              Comelli Transportes &copy; {new Date().getFullYear()} • Dashboard de Médias da Frota
            </p>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
