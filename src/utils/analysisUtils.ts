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
  eficiencia: number;
}

export function calculateLoadEfficiency(data: ProcessedFleetData[]): LoadEfficiencyData[] {
  const vehicleStats = new Map<string, {
    kmTotal: number;
    kmCarregado: number;
    marca: string;
    modelo: string;
    grupo: string;
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
    .sort((a, b) => a.eficiencia - b.eficiencia);
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
  variacao: number;
  isAnomaly: boolean;
}

export function detectAnomalies(data: ProcessedFleetData[], dropThreshold = -10): AnomalyData[] {
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

  return Array.from(modelStats.entries())
    .map(([modelo, stats]) => {
      const mediaBenchmark = stats.total / stats.count;
      const veiculosAbaixo: ModelBenchmark["veiculosAbaixo"] = [];

      vehicleStats.forEach((vStats, veiculo) => {
        if (vStats.modelo === modelo) {
          const mediaVeiculo = vStats.total / vStats.count;
          if (mediaVeiculo < mediaBenchmark * 0.95) {
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
      const last3 = sorted.slice(-4, -1);
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
    grupo: string;
  }>();

  const overallAvg = data.reduce((sum, d) => sum + d.mediaCarregadoNum, 0) / data.length;

  loadEfficiency.forEach((le) => {
    if (le.eficiencia < 70) {
      const existing = vehicleProblems.get(le.veiculo) || {
        problemas: [], score: 0, marca: le.marca, modelo: le.modelo, grupo: le.grupo
      };
      existing.problemas.push(`Baixa eficiência de carga: ${le.eficiencia.toFixed(0)}%`);
      existing.score += 3;
      vehicleProblems.set(le.veiculo, existing);
    }
  });

  anomalies.forEach((a) => {
    const existing = vehicleProblems.get(a.veiculo) || {
      problemas: [], score: 0, marca: a.marca, modelo: a.modelo, grupo: a.grupo
    };
    existing.problemas.push(`Queda de ${Math.abs(a.variacao).toFixed(0)}% em ${a.mesAtual}`);
    existing.score += 4;
    vehicleProblems.set(a.veiculo, existing);
  });

  trends.forEach((t) => {
    if (t.tendencia === "down" && t.variacao < -5) {
      const existing = vehicleProblems.get(t.veiculo) || {
        problemas: [], score: 0, marca: t.marca, modelo: t.modelo, grupo: t.grupo
      };
      existing.problemas.push(`Tendência de queda: ${t.variacao.toFixed(1)}%`);
      existing.score += 2;
      vehicleProblems.set(t.veiculo, existing);
    }
  });

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
        problemas: [], score: 0, marca: stats.marca, modelo: stats.modelo, grupo: stats.grupo
      };
      existing.problemas.push(`Abaixo da média da frota: ${media.toFixed(2)} km/l`);
      existing.score += 1;
      vehicleProblems.set(veiculo, existing);
    }
  });

  return Array.from(vehicleProblems.entries())
    .map(([veiculo, d]) => ({
      veiculo,
      marca: d.marca,
      modelo: d.modelo,
      grupo: d.grupo,
      problemas: d.problemas,
      prioridade: (d.score >= 5 ? "alta" : d.score >= 3 ? "media" : "baixa") as "alta" | "media" | "baixa",
      score: d.score,
    }))
    .sort((a, b) => b.score - a.score);
}
