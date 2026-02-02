import { useMemo, useState } from "react";
import { Gauge, Route, Truck, RefreshCw, Cloud, Loader2 } from "lucide-react";
import { ProcessedFleetData, FleetData } from "@/types/fleet";
import { calculateFleetStats, getVehicleRanking, getGroupStats, getMonthlyTrend, getModelStats, formatNumber, formatKm } from "@/utils/fleetUtils";
import { calculateLoadEfficiency, detectAnomalies, calculateModelBenchmark, calculateTrends, generateAttentionReport } from "@/utils/analysisUtils";
import { fetchGoogleSheetsData } from "@/utils/dataLoader";
import { StatCard } from "./StatCard";
import { VehicleRanking } from "./VehicleRanking";
import { ModelRanking } from "./ModelRanking";
import { GroupChart } from "./GroupChart";
import { GroupTabs } from "./GroupTabs";
import { MonthlyTrendChart } from "./MonthlyTrendChart";
import { DataTable } from "./DataTable";
import { VehiclePerformanceChart } from "./VehiclePerformanceChart";
import { DashboardSettings, useDashboardVisibility } from "./DashboardSettings";
import { GlobalFilters } from "./GlobalFilters";
import { LoadEfficiencyCard } from "./LoadEfficiencyCard";
import { AnomalyDetector } from "./AnomalyDetector";
import { VehicleComparator } from "./VehicleComparator";
import { ModelBenchmarkCard } from "./ModelBenchmarkCard";
import { TrendIndicator } from "./TrendIndicator";
import { AttentionReport } from "./AttentionReport";

interface DashboardProps {
  data: ProcessedFleetData[];
  onReset: () => void;
  onDataUpdate: (data: FleetData[]) => void;
}

export function Dashboard({
  data,
  onReset,
  onDataUpdate
}: DashboardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [filteredData, setFilteredData] = useState<ProcessedFleetData[]>(data);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const { visibility, toggleSection, resetToDefault } = useDashboardVisibility();
  
  // Use filtered data for all calculations
  const activeData = filteredData.length > 0 ? filteredData : data;
  
  const stats = useMemo(() => calculateFleetStats(activeData), [activeData]);
  const vehicleRanking = useMemo(() => getVehicleRanking(activeData), [activeData]);
  const modelRanking = useMemo(() => getModelStats(activeData), [activeData]);
  const groupStats = useMemo(() => getGroupStats(activeData), [activeData]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(activeData), [activeData]);
  
  // New analysis calculations
  const loadEfficiency = useMemo(() => calculateLoadEfficiency(activeData), [activeData]);
  const anomalies = useMemo(() => detectAnomalies(activeData), [activeData]);
  const modelBenchmark = useMemo(() => calculateModelBenchmark(activeData), [activeData]);
  const trends = useMemo(() => calculateTrends(activeData), [activeData]);
  const attentionReport = useMemo(() => 
    generateAttentionReport(activeData, loadEfficiency, anomalies, trends), 
    [activeData, loadEfficiency, anomalies, trends]
  );

  const handleFilterChange = (newData: ProcessedFleetData[]) => {
    setFilteredData(newData);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">Comelli Transportes</h1>
            <p className="text-muted-foreground mt-1">
              Frota de Carga Viva • {stats.totalVeiculos} veículos • {activeData.length} registros
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <DashboardSettings
              visibility={visibility}
              onToggle={toggleSection}
              onReset={resetToDefault}
            />
            <button
              onClick={async () => {
                setIsSyncing(true);
                try {
                  const newData = await fetchGoogleSheetsData();
                  onDataUpdate(newData);
                } catch {
                  alert("Erro ao sincronizar");
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-xl font-medium transition-colors hover:bg-accent/90 disabled:opacity-50"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
              Atualizar
            </button>
            <button
              onClick={onReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl font-medium transition-colors hover:bg-secondary/80"
            >
              <RefreshCw className="w-4 h-4" />
              Novo Arquivo
            </button>
          </div>
        </div>

        {/* Global Filters */}
        {visibility.globalFilters && (
          <GlobalFilters
            data={data}
            onFilterChange={handleFilterChange}
            onVehicleSelect={setSelectedVehicle}
            selectedVehicle={selectedVehicle}
          />
        )}

        {/* Main Metric - Média Carregado */}
        {visibility.mainStats && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1">
              <StatCard title="Média Carregado" value={formatNumber(stats.avgMediaCarregado) + " km/l"} subtitle="Média geral da frota carregada" icon={Gauge} highlight delay={0} />
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              <StatCard title="KM Total Rodado" value={formatKm(stats.totalKmRodado)} subtitle="Quilometragem total" icon={Route} delay={50} />
              <StatCard title="KM Carregado" value={formatKm(stats.totalKmCarregado)} subtitle="Quilometragem carregado" icon={Truck} delay={100} />
            </div>
          </div>
        )}

        {/* Monthly Trend - moved to top */}
        {visibility.monthlyTrend && (
          <div className="mb-6">
            <MonthlyTrendChart data={monthlyTrend} />
          </div>
        )}

        {/* Attention Report */}
        {visibility.attentionReport && (
          <div className="mb-6">
            <AttentionReport data={attentionReport} />
          </div>
        )}

        {/* Analysis Cards Row */}
        {(visibility.loadEfficiency || visibility.anomalyDetector) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {visibility.loadEfficiency && <LoadEfficiencyCard data={loadEfficiency} />}
            {visibility.anomalyDetector && <AnomalyDetector data={anomalies} />}
          </div>
        )}

        {/* Vehicle Comparator */}
        {visibility.vehicleComparator && (
          <div className="mb-6">
            <VehicleComparator data={activeData} />
          </div>
        )}

        {/* Benchmark and Trends Row */}
        {(visibility.modelBenchmark || visibility.trendIndicator) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {visibility.modelBenchmark && <ModelBenchmarkCard data={modelBenchmark} />}
            {visibility.trendIndicator && <TrendIndicator data={trends} />}
          </div>
        )}

        {/* Group Performance */}
        {visibility.groupChart && (
          <div className="mb-6">
            <GroupChart data={activeData} />
          </div>
        )}

        {/* Group Tabs */}
        {visibility.groupTabs && (
          <div className="mb-6">
            <GroupTabs data={activeData} />
          </div>
        )}

        {/* Vehicle Performance Chart */}
        {visibility.vehiclePerformance && (
          <div className="mb-6">
            <VehiclePerformanceChart data={activeData} />
          </div>
        )}

        {/* Vehicle Ranking */}
        {visibility.vehicleRanking && (
          <div className="mb-6">
            <VehicleRanking vehicles={vehicleRanking} />
          </div>
        )}

        {/* Model Ranking */}
        {visibility.modelRanking && (
          <div className="mb-6">
            <ModelRanking models={modelRanking} />
          </div>
        )}

        {/* Data Table */}
        {visibility.dataTable && <DataTable data={activeData} />}
      </div>
    </div>
  );
}
