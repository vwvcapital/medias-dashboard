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
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
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

function parseNumber(value: string): number {
  if (!value || value.trim() === "") return 0;

  let cleaned = value.trim();

  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");

  if (lastComma > lastDot && lastComma > cleaned.length - 4) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    return Math.round(parseFloat(cleaned)) || 0;
  }

  if (lastDot > lastComma && lastDot > cleaned.length - 4) {
    cleaned = cleaned.replace(/,/g, "");
    return Math.round(parseFloat(cleaned)) || 0;
  }

  const digitsOnly = cleaned.replace(/[^\d]/g, "");
  return parseInt(digitsOnly, 10) || 0;
}
