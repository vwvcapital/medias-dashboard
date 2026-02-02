import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface DashboardVisibility {
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

const STORAGE_KEY = "dashboard-visibility-v2";

export function useDashboardVisibility() {
  const [visibility, setVisibility] = useState<DashboardVisibility>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...defaultVisibility, ...JSON.parse(stored) };
      } catch {
        return defaultVisibility;
      }
    }
    return defaultVisibility;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
  }, [visibility]);

  const toggleSection = (section: keyof DashboardVisibility) => {
    setVisibility((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const resetToDefault = () => {
    setVisibility(defaultVisibility);
  };

  return { visibility, toggleSection, resetToDefault };
}

interface DashboardSettingsProps {
  visibility: DashboardVisibility;
  onToggle: (section: keyof DashboardVisibility) => void;
  onReset: () => void;
}

export function DashboardSettings({
  visibility,
  onToggle,
  onReset,
}: DashboardSettingsProps) {
  const [open, setOpen] = useState(false);

  const visibleCount = Object.values(visibility).filter(Boolean).length;
  const totalCount = Object.keys(visibility).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-xl font-medium transition-colors hover:bg-muted/80">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Personalizar</span>
          <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-md">
            {visibleCount}/{totalCount}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-[320px] sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Personalizar Dashboard
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione quais seções deseja visualizar no dashboard.
          </p>
          <div className="space-y-2">
            {(Object.keys(sectionLabels) as Array<keyof DashboardVisibility>).map(
              (section) => (
                <label
                  key={section}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={visibility[section]}
                    onCheckedChange={() => onToggle(section)}
                  />
                  <span className="text-sm font-medium">
                    {sectionLabels[section]}
                  </span>
                </label>
              )
            )}
          </div>
          <button
            onClick={onReset}
            className="w-full mt-4 px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
          >
            Restaurar Padrão
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
