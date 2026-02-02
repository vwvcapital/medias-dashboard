import { FleetData, ProcessedFleetData, FleetStats } from "@/types/fleet";

// Robust number parser that handles various formats
function parseNumericValue(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;

  // Convert to string and clean
  let cleaned = String(value).trim();
  
  // Remove whitespace and currency symbols
  cleaned = cleaned.replace(/\s/g, "").replace(/[R$€$]/g, "");
  
  // Handle empty after cleaning
  if (!cleaned) return 0;

  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");

  if (lastDot === -1 && lastComma === -1) {
    // No decimal separators - just parse
    const num = parseFloat(cleaned.replace(/[^\d-]/g, ""));
    return isNaN(num) ? 0 : num;
  }

  if (lastDot > lastComma) {
    // US/UK format: 1,234.56 (remove thousand separators, keep decimal)
    cleaned = cleaned.replace(/,/g, "");
  } else if (lastComma > lastDot) {
    // European/BR format: 1.234,56 (remove thousand separators, replace decimal)
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parseFleetData(data: FleetData[]): ProcessedFleetData[] {
  return data.map((item) => ({
    ...item,
    mediaNum: parseNumericValue(item.Média),
    mediaCarregadoNum: parseNumericValue(item["Média Carregado"]),
  }));
}

export function calculateFleetStats(data: ProcessedFleetData[]): FleetStats {
  if (data.length === 0) {
    return {
      avgMediaCarregado: 0,
      totalKmRodado: 0,
      totalKmCarregado: 0,
      totalVeiculos: 0,
      avgMedia: 0,
      bestVehicle: null,
      worstVehicle: null,
    };
  }

  const uniqueVehicles = new Set(data.map((d) => d.Veículo));
  const totalKmRodado = data.reduce((acc, d) => acc + d["KM Rodado"], 0);
  const totalKmCarregado = data.reduce((acc, d) => acc + d["KM Rodado Carregado"], 0);
  const avgMediaCarregado = data.reduce((acc, d) => acc + d.mediaCarregadoNum, 0) / data.length;
  const avgMedia = data.reduce((acc, d) => acc + d.mediaNum, 0) / data.length;

  const sortedByMedia = [...data].sort((a, b) => b.mediaCarregadoNum - a.mediaCarregadoNum);
  const bestVehicle = sortedByMedia[0];
  const worstVehicle = sortedByMedia[sortedByMedia.length - 1];

  return {
    avgMediaCarregado,
    totalKmRodado,
    totalKmCarregado,
    totalVeiculos: uniqueVehicles.size,
    avgMedia,
    bestVehicle,
    worstVehicle,
  };
}

export function getVehicleRanking(data: ProcessedFleetData[]): ProcessedFleetData[] {
  const vehicleAverages = new Map<string, { total: number; count: number; data: ProcessedFleetData }>();

  data.forEach((item) => {
    const existing = vehicleAverages.get(item.Veículo);
    if (existing) {
      existing.total += item.mediaCarregadoNum;
      existing.count += 1;
    } else {
      vehicleAverages.set(item.Veículo, { total: item.mediaCarregadoNum, count: 1, data: item });
    }
  });

  return Array.from(vehicleAverages.entries())
    .map(([_, value]) => ({
      ...value.data,
      mediaCarregadoNum: value.total / value.count,
    }))
    .sort((a, b) => b.mediaCarregadoNum - a.mediaCarregadoNum);
}

export function getModelStats(data: ProcessedFleetData[]) {
  const modelStats = new Map<string, { totalMedia: number; count: number; marca: string }>();

  data.forEach((item) => {
    const existing = modelStats.get(item.Modelo);
    if (existing) {
      existing.totalMedia += item.mediaCarregadoNum;
      existing.count += 1;
    } else {
      modelStats.set(item.Modelo, {
        totalMedia: item.mediaCarregadoNum,
        count: 1,
        marca: item.Marca,
      });
    }
  });

  return Array.from(modelStats.entries())
    .map(([modelo, stats]) => ({
      modelo,
      marca: stats.marca,
      mediaCarregado: stats.totalMedia / stats.count,
      count: stats.count,
    }))
    .sort((a, b) => b.mediaCarregado - a.mediaCarregado);
}

export function getGroupStats(data: ProcessedFleetData[]) {
  const groupStats = new Map<string, { totalKm: number; totalMedia: number; count: number }>();

  data.forEach((item) => {
    const existing = groupStats.get(item.Grupo);
    if (existing) {
      existing.totalKm += item["KM Rodado Carregado"];
      existing.totalMedia += item.mediaCarregadoNum;
      existing.count += 1;
    } else {
      groupStats.set(item.Grupo, {
        totalKm: item["KM Rodado Carregado"],
        totalMedia: item.mediaCarregadoNum,
        count: 1,
      });
    }
  });

  return Array.from(groupStats.entries()).map(([grupo, stats]) => ({
    grupo,
    kmTotal: stats.totalKm,
    mediaCarregado: stats.totalMedia / stats.count,
  }));
}

export function getMonthlyTrend(data: ProcessedFleetData[]) {
  const monthlyStats = new Map<string, { totalMedia: number; count: number; totalKm: number }>();

  data.forEach((item) => {
    const existing = monthlyStats.get(item.Mês);
    if (existing) {
      existing.totalMedia += item.mediaCarregadoNum;
      existing.totalKm += item["KM Rodado Carregado"];
      existing.count += 1;
    } else {
      monthlyStats.set(item.Mês, {
        totalMedia: item.mediaCarregadoNum,
        totalKm: item["KM Rodado Carregado"],
        count: 1,
      });
    }
  });

  return Array.from(monthlyStats.entries())
    .map(([mes, stats]) => ({
      mes,
      mediaCarregado: stats.totalMedia / stats.count,
      kmTotal: stats.totalKm,
    }))
    .sort((a, b) => {
      const [mesA, anoA] = a.mes.split("/");
      const [mesB, anoB] = b.mes.split("/");
      return anoA.localeCompare(anoB) || mesA.localeCompare(mesB);
    });
}

export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatKm(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(".", ",") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0).replace(".", ",") + "K";
  }
  return num.toLocaleString("pt-BR");
}
