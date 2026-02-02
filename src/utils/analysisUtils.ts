import { ProcessedFleetData } from "@/types/fleet";

// Load Efficiency Analysis
export interface LoadEfficiencyData {
  veiculo: string;
  marca: string;
  modelo: string;
  grupo: string;
  kmTotal: number;
  kmCarregado: number;
  kmVazio: number;
  eficiencia: number; // percentage of km loaded
}

export function calculateLoadEfficiency(data: ProcessedFleetData[]): LoadEfficiencyData[] {
  const vehicleStats = new Map<string, { 
    kmTotal: number; 
    kmCarregado: number; 
    marca: string; 
    modelo: string; 
    grupo: string 
  }>();

  data.forEach((item) => {
    const existing = vehicleStats.get(item.Veículo);
    if (existing) {
      existing.kmTotal += item["KM Rodado"];
      existing.kmCarregado += item["KM Rodado Carregado"];
    } else {
      vehicleStats.set(item.Veículo, {
        kmTotal: item["KM Rodado"],
        kmCarregado: item["KM Rodado Carregado"],
        marca: item.Marca,
        modelo: item.Modelo,
        grupo: item.Grupo,
      });
    }
  });

  return Array.from(vehicleStats.entries())
    .map(([veiculo, stats]) => ({
      veiculo,
      marca: stats.marca,
      modelo: stats.modelo,
      grupo: stats.grupo,
      kmTotal: stats.kmTotal,
      kmCarregado: stats.kmCarregado,
      kmVazio: stats.kmTotal - stats.kmCarregado,
      eficiencia: stats.kmTotal > 0 ? (stats.kmCarregado / stats.kmTotal) * 100 : 0,
    }))
    .sort((a, b) => a.eficiencia - b.eficiencia); // Sort by lowest efficiency first
}

// Consistency Analysis (Standard Deviation)
export interface ConsistencyData {
  veiculo: string;
  marca: string;
  modelo: string;
  grupo: string;
  media: number;
  desvioPadrao: number;
  coeficienteVariacao: number; // CV = (stdDev / mean) * 100
  valores: number[];
  isInconsistent: boolean;
}

export function calculateConsistency(data: ProcessedFleetData[], threshold = 15): ConsistencyData[] {
  const vehicleData = new Map<string, { 
    valores: number[]; 
    marca: string; 
    modelo: string; 
    grupo: string 
  }>();

  data.forEach((item) => {
    const existing = vehicleData.get(item.Veículo);
    if (existing) {
      existing.valores.push(item.mediaCarregadoNum);
    } else {
      vehicleData.set(item.Veículo, {
        valores: [item.mediaCarregadoNum],
        marca: item.Marca,
        modelo: item.Modelo,
        grupo: item.Grupo,
      });
    }
  });

  return Array.from(vehicleData.entries())
    .map(([veiculo, stats]) => {
      const n = stats.valores.length;
      const media = stats.valores.reduce((a, b) => a + b, 0) / n;
      const variance = stats.valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / n;
      const desvioPadrao = Math.sqrt(variance);
      const coeficienteVariacao = media > 0 ? (desvioPadrao / media) * 100 : 0;

      return {
        veiculo,
        marca: stats.marca,
        modelo: stats.modelo,
        grupo: stats.grupo,
        media,
        desvioPadrao,
        coeficienteVariacao,
        valores: stats.valores,
        isInconsistent: coeficienteVariacao > threshold,
      };
    })
    .sort((a, b) => b.coeficienteVariacao - a.coeficienteVariacao);
}

// Anomaly Detection
export interface AnomalyData {
  veiculo: string;
  marca: string;
  modelo: string;
  grupo: string;
  mesAtual: string;
  valorAtual: number;
  mediaHistorica: number;
  variacao: number; // percentage change
  isAnomaly: boolean;
}

export function detectAnomalies(data: ProcessedFleetData[], dropThreshold = -10): AnomalyData[] {
  // Group data by vehicle
  const vehicleData = new Map<string, ProcessedFleetData[]>();
  data.forEach((item) => {
    const existing = vehicleData.get(item.Veículo);
    if (existing) {
      existing.push(item);
    } else {
      vehicleData.set(item.Veículo, [item]);
    }
  });

  const anomalies: AnomalyData[] = [];

  vehicleData.forEach((records, veiculo) => {
    if (records.length < 2) return;

    // Sort by date
    const sorted = [...records].sort((a, b) => {
      const [mesA, anoA] = a.Mês.split("/");
      const [mesB, anoB] = b.Mês.split("/");
      return anoA.localeCompare(anoB) || mesA.localeCompare(mesB);
    });

    const latest = sorted[sorted.length - 1];
    const previous = sorted.slice(0, -1);
    const mediaHistorica = previous.reduce((sum, r) => sum + r.mediaCarregadoNum, 0) / previous.length;
    const variacao = mediaHistorica > 0 ? ((latest.mediaCarregadoNum - mediaHistorica) / mediaHistorica) * 100 : 0;

    anomalies.push({
      veiculo,
      marca: latest.Marca,
      modelo: latest.Modelo,
      grupo: latest.Grupo,
      mesAtual: latest.Mês,
      valorAtual: latest.mediaCarregadoNum,
      mediaHistorica,
      variacao,
      isAnomaly: variacao < dropThreshold,
    });
  });

  return anomalies
    .filter((a) => a.isAnomaly)
    .sort((a, b) => a.variacao - b.variacao);
}

// Model Benchmark
export interface ModelBenchmark {
  modelo: string;
  marca: string;
  mediaBenchmark: number;
  veiculosAbaixo: Array<{
    veiculo: string;
    media: number;
    diferenca: number;
  }>;
}

export function calculateModelBenchmark(data: ProcessedFleetData[]): ModelBenchmark[] {
  // First, calculate model averages
  const modelStats = new Map<string, { total: number; count: number; marca: string }>();
  data.forEach((item) => {
    const existing = modelStats.get(item.Modelo);
    if (existing) {
      existing.total += item.mediaCarregadoNum;
      existing.count += 1;
    } else {
      modelStats.set(item.Modelo, {
        total: item.mediaCarregadoNum,
        count: 1,
        marca: item.Marca,
      });
    }
  });

  // Then, calculate per-vehicle averages
  const vehicleStats = new Map<string, { total: number; count: number; modelo: string }>();
  data.forEach((item) => {
    const existing = vehicleStats.get(item.Veículo);
    if (existing) {
      existing.total += item.mediaCarregadoNum;
      existing.count += 1;
    } else {
      vehicleStats.set(item.Veículo, {
        total: item.mediaCarregadoNum,
        count: 1,
        modelo: item.Modelo,
      });
    }
  });

  // Build benchmark data
  return Array.from(modelStats.entries())
    .map(([modelo, stats]) => {
      const mediaBenchmark = stats.total / stats.count;
      const veiculosAbaixo: ModelBenchmark["veiculosAbaixo"] = [];

      vehicleStats.forEach((vStats, veiculo) => {
        if (vStats.modelo === modelo) {
          const mediaVeiculo = vStats.total / vStats.count;
          if (mediaVeiculo < mediaBenchmark * 0.95) { // 5% below benchmark
            veiculosAbaixo.push({
              veiculo,
              media: mediaVeiculo,
              diferenca: mediaVeiculo - mediaBenchmark,
            });
          }
        }
      });

      return {
        modelo,
        marca: stats.marca,
        mediaBenchmark,
        veiculosAbaixo: veiculosAbaixo.sort((a, b) => a.diferenca - b.diferenca),
      };
    })
    .filter((b) => b.veiculosAbaixo.length > 0)
    .sort((a, b) => b.veiculosAbaixo.length - a.veiculosAbaixo.length);
}

// Performance Heatmap Data
export interface HeatmapData {
  veiculo: string;
  meses: Array<{
    mes: string;
    valor: number;
    performance: "good" | "medium" | "bad";
  }>;
}

export function calculateHeatmapData(data: ProcessedFleetData[]): { heatmap: HeatmapData[]; meses: string[] } {
  // Get unique months sorted
  const mesesSet = new Set<string>();
  data.forEach((item) => mesesSet.add(item.Mês));
  const meses = Array.from(mesesSet).sort((a, b) => {
    const [mesA, anoA] = a.split("/");
    const [mesB, anoB] = b.split("/");
    return anoA.localeCompare(anoB) || mesA.localeCompare(mesB);
  });

  // Calculate overall average for thresholds
  const overallAvg = data.reduce((sum, d) => sum + d.mediaCarregadoNum, 0) / data.length;
  const goodThreshold = overallAvg * 1.05;
  const badThreshold = overallAvg * 0.95;

  // Group by vehicle
  const vehicleData = new Map<string, Map<string, number>>();
  data.forEach((item) => {
    if (!vehicleData.has(item.Veículo)) {
      vehicleData.set(item.Veículo, new Map());
    }
    const vMap = vehicleData.get(item.Veículo)!;
    const existing = vMap.get(item.Mês);
    if (existing) {
      vMap.set(item.Mês, (existing + item.mediaCarregadoNum) / 2);
    } else {
      vMap.set(item.Mês, item.mediaCarregadoNum);
    }
  });

  const heatmap: HeatmapData[] = Array.from(vehicleData.entries()).map(([veiculo, mesesMap]) => ({
    veiculo,
    meses: meses.map((mes) => {
      const valor = mesesMap.get(mes) || 0;
      let performance: "good" | "medium" | "bad" = "medium";
      if (valor >= goodThreshold) performance = "good";
      else if (valor > 0 && valor <= badThreshold) performance = "bad";
      return { mes, valor, performance };
    }),
  }));

  return { heatmap, meses };
}

// Trend Indicator
export interface TrendData {
  veiculo: string;
  marca: string;
  modelo: string;
  grupo: string;
  mediaAtual: number;
  media3Meses: number;
  tendencia: "up" | "down" | "stable";
  variacao: number;
}

export function calculateTrends(data: ProcessedFleetData[]): TrendData[] {
  // Group by vehicle and sort by date
  const vehicleData = new Map<string, ProcessedFleetData[]>();
  data.forEach((item) => {
    const existing = vehicleData.get(item.Veículo);
    if (existing) {
      existing.push(item);
    } else {
      vehicleData.set(item.Veículo, [item]);
    }
  });

  return Array.from(vehicleData.entries())
    .map(([veiculo, records]) => {
      const sorted = [...records].sort((a, b) => {
        const [mesA, anoA] = a.Mês.split("/");
        const [mesB, anoB] = b.Mês.split("/");
        return anoA.localeCompare(anoB) || mesA.localeCompare(mesB);
      });

      if (sorted.length < 2) {
        return {
          veiculo,
          marca: sorted[0].Marca,
          modelo: sorted[0].Modelo,
          grupo: sorted[0].Grupo,
          mediaAtual: sorted[0].mediaCarregadoNum,
          media3Meses: sorted[0].mediaCarregadoNum,
          tendencia: "stable" as const,
          variacao: 0,
        };
      }

      const latest = sorted[sorted.length - 1];
      const last3 = sorted.slice(-4, -1); // Last 3 months excluding current
      const media3Meses = last3.length > 0 
        ? last3.reduce((sum, r) => sum + r.mediaCarregadoNum, 0) / last3.length 
        : latest.mediaCarregadoNum;
      
      const variacao = media3Meses > 0 
        ? ((latest.mediaCarregadoNum - media3Meses) / media3Meses) * 100 
        : 0;

      let tendencia: "up" | "down" | "stable" = "stable";
      if (variacao > 3) tendencia = "up";
      else if (variacao < -3) tendencia = "down";

      return {
        veiculo,
        marca: latest.Marca,
        modelo: latest.Modelo,
        grupo: latest.Grupo,
        mediaAtual: latest.mediaCarregadoNum,
        media3Meses,
        tendencia,
        variacao,
      };
    })
    .sort((a, b) => b.variacao - a.variacao);
}

// Attention Report
export interface AttentionVehicle {
  veiculo: string;
  marca: string;
  modelo: string;
  grupo: string;
  problemas: string[];
  prioridade: "alta" | "media" | "baixa";
  score: number;
}

export function generateAttentionReport(
  data: ProcessedFleetData[],
  loadEfficiency: LoadEfficiencyData[],
  anomalies: AnomalyData[],
  trends: TrendData[]
): AttentionVehicle[] {
  const vehicleProblems = new Map<string, { 
    problemas: string[]; 
    score: number; 
    marca: string; 
    modelo: string; 
    grupo: string 
  }>();

  // Overall average
  const overallAvg = data.reduce((sum, d) => sum + d.mediaCarregadoNum, 0) / data.length;

  // Check load efficiency
  loadEfficiency.forEach((le) => {
    if (le.eficiencia < 70) {
      const existing = vehicleProblems.get(le.veiculo) || { 
        problemas: [], 
        score: 0, 
        marca: le.marca, 
        modelo: le.modelo, 
        grupo: le.grupo 
      };
      existing.problemas.push(`Baixa eficiência de carga: ${le.eficiencia.toFixed(0)}%`);
      existing.score += 3;
      vehicleProblems.set(le.veiculo, existing);
    }
  });

  // Check anomalies
  anomalies.forEach((a) => {
    const existing = vehicleProblems.get(a.veiculo) || { 
      problemas: [], 
      score: 0, 
      marca: a.marca, 
      modelo: a.modelo, 
      grupo: a.grupo 
    };
    existing.problemas.push(`Queda de ${Math.abs(a.variacao).toFixed(0)}% em ${a.mesAtual}`);
    existing.score += 4;
    vehicleProblems.set(a.veiculo, existing);
  });

  // Check trends
  trends.forEach((t) => {
    if (t.tendencia === "down" && t.variacao < -5) {
      const existing = vehicleProblems.get(t.veiculo) || { 
        problemas: [], 
        score: 0, 
        marca: t.marca, 
        modelo: t.modelo, 
        grupo: t.grupo 
      };
      existing.problemas.push(`Tendência de queda: ${t.variacao.toFixed(1)}%`);
      existing.score += 2;
      vehicleProblems.set(t.veiculo, existing);
    }
  });

  // Check if below overall average
  const vehicleAvg = new Map<string, { total: number; count: number; marca: string; modelo: string; grupo: string }>();
  data.forEach((item) => {
    const existing = vehicleAvg.get(item.Veículo);
    if (existing) {
      existing.total += item.mediaCarregadoNum;
      existing.count += 1;
    } else {
      vehicleAvg.set(item.Veículo, {
        total: item.mediaCarregadoNum,
        count: 1,
        marca: item.Marca,
        modelo: item.Modelo,
        grupo: item.Grupo,
      });
    }
  });

  vehicleAvg.forEach((stats, veiculo) => {
    const media = stats.total / stats.count;
    if (media < overallAvg * 0.9) {
      const existing = vehicleProblems.get(veiculo) || { 
        problemas: [], 
        score: 0, 
        marca: stats.marca, 
        modelo: stats.modelo, 
        grupo: stats.grupo 
      };
      existing.problemas.push(`Abaixo da média da frota: ${media.toFixed(2)} km/l`);
      existing.score += 1;
      vehicleProblems.set(veiculo, existing);
    }
  });

  return Array.from(vehicleProblems.entries())
    .map(([veiculo, data]) => ({
      veiculo,
      marca: data.marca,
      modelo: data.modelo,
      grupo: data.grupo,
      problemas: data.problemas,
      prioridade: (data.score >= 5 ? "alta" : data.score >= 3 ? "media" : "baixa") as "alta" | "media" | "baixa",
      score: data.score,
    }))
    .sort((a, b) => b.score - a.score);
}

// Filter data by period
export function filterByPeriod(
  data: ProcessedFleetData[], 
  startDate: string | null, 
  endDate: string | null
): ProcessedFleetData[] {
  if (!startDate && !endDate) return data;

  return data.filter((item) => {
    const [mes, ano] = item.Mês.split("/");
    const itemDate = new Date(parseInt(`20${ano}`), parseInt(mes) - 1, 1);
    
    if (startDate) {
      const start = new Date(startDate);
      if (itemDate < start) return false;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      if (itemDate > end) return false;
    }
    
    return true;
  });
}

// Get unique vehicles for search
export function getUniqueVehicles(data: ProcessedFleetData[]): Array<{
  veiculo: string;
  marca: string;
  modelo: string;
  grupo: string;
}> {
  const vehicles = new Map<string, { marca: string; modelo: string; grupo: string }>();
  data.forEach((item) => {
    if (!vehicles.has(item.Veículo)) {
      vehicles.set(item.Veículo, {
        marca: item.Marca,
        modelo: item.Modelo,
        grupo: item.Grupo,
      });
    }
  });
  return Array.from(vehicles.entries())
    .map(([veiculo, info]) => ({ veiculo, ...info }))
    .sort((a, b) => a.veiculo.localeCompare(b.veiculo));
}
