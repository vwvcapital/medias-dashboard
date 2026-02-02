import * as XLSX from "xlsx";
import { FleetData } from "@/types/fleet";

const GOOGLE_SHEETS_ID = "1uQiQVPaeRi4Ls_-9-pQ7IpvKUQKiQaxTeolkxvP6oK0";

export async function fetchGoogleSheetsData(): Promise<FleetData[]> {
  const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_ID}/export?format=csv`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Falha ao carregar dados do Google Sheets");
  }
  
  const csvText = await response.text();
  return parseCSV(csvText);
}

function parseCSV(csvText: string): FleetData[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];
  
  const data: FleetData[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length >= 9 && values[0]) {
      data.push({
        Mês: values[0],
        Veículo: values[1],
        Marca: values[2],
        Modelo: values[3],
        Grupo: values[4],
        "KM Rodado": parseNumber(values[5]),
        "KM Rodado Carregado": parseNumber(values[6]),
        Média: values[7],
        "Média Carregado": values[8],
      });
    }
  }
  
  return data;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Handle escaped quotes ("")
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Robust number parser for KM values (integers with possible formatting)
function parseNumber(value: string): number {
  if (!value || value.trim() === "") return 0;
  
  // Remove all non-digit characters except decimal separators
  let cleaned = value.trim();
  
  // Check if it looks like a decimal number (has comma or dot as decimal separator)
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  
  if (lastComma > lastDot && lastComma > cleaned.length - 4) {
    // European format: remove dots (thousand sep), replace comma with dot
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    return Math.round(parseFloat(cleaned)) || 0;
  }
  
  if (lastDot > lastComma && lastDot > cleaned.length - 4) {
    // US format: remove commas (thousand sep)
    cleaned = cleaned.replace(/,/g, "");
    return Math.round(parseFloat(cleaned)) || 0;
  }
  
  // Just extract digits
  const digitsOnly = cleaned.replace(/[^\d]/g, "");
  return parseInt(digitsOnly, 10) || 0;
}

export function parseXLSXFile(file: File): Promise<FleetData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);
        
        const fleetData: FleetData[] = jsonData.map((row: any) => ({
          Mês: String(row["Mês"] || row["Mes"] || ""),
          Veículo: String(row["Veículo"] || row["Veiculo"] || ""),
          Marca: String(row["Marca"] || ""),
          Modelo: String(row["Modelo"] || ""),
          Grupo: String(row["Grupo"] || ""),
          "KM Rodado": Number(row["KM Rodado"]) || 0,
          "KM Rodado Carregado": Number(row["KM Rodado Carregado"]) || 0,
          Média: String(row["Média"] || row["Media"] || "0"),
          "Média Carregado": String(row["Média Carregado"] || row["Media Carregado"] || "0"),
        }));
        
        resolve(fleetData);
      } catch (error) {
        reject(new Error("Erro ao processar arquivo XLSX"));
      }
    };
    
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsArrayBuffer(file);
  });
}

export function parseJSONFile(file: File): Promise<FleetData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          resolve(json);
        } else {
          reject(new Error("O arquivo deve conter um array de dados"));
        }
      } catch {
        reject(new Error("Erro ao processar arquivo JSON"));
      }
    };
    
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsText(file);
  });
}
