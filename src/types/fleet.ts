export interface FleetData {
  Mês: string;
  Veículo: string;
  Marca: string;
  Modelo: string;
  Grupo: string;
  "KM Rodado": number;
  "KM Rodado Carregado": number;
  Média: string;
  "Média Carregado": string;
}

export interface ProcessedFleetData extends FleetData {
  mediaNum: number;
  mediaCarregadoNum: number;
}

export interface FleetStats {
  avgMediaCarregado: number;
  totalKmRodado: number;
  totalKmCarregado: number;
  totalVeiculos: number;
  avgMedia: number;
  bestVehicle: ProcessedFleetData | null;
  worstVehicle: ProcessedFleetData | null;
}
