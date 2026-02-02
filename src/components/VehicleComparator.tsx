import { useState, useMemo } from "react";
import { GitCompare, X, Check, ChevronsUpDown } from "lucide-react";
import { ProcessedFleetData } from "@/types/fleet";
import { formatNumber } from "@/utils/fleetUtils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface VehicleComparatorProps {
  data: ProcessedFleetData[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function VehicleComparator({ data }: VehicleComparatorProps) {
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const vehicles = useMemo(() => {
    const uniqueVehicles = new Map<string, { marca: string; modelo: string; grupo: string }>();
    data.forEach((item) => {
      if (!uniqueVehicles.has(item.Veículo)) {
        uniqueVehicles.set(item.Veículo, {
          marca: item.Marca,
          modelo: item.Modelo,
          grupo: item.Grupo,
        });
      }
    });
    return Array.from(uniqueVehicles.entries())
      .map(([veiculo, info]) => ({ veiculo, ...info }))
      .sort((a, b) => a.veiculo.localeCompare(b.veiculo));
  }, [data]);

  const chartData = useMemo(() => {
    if (selectedVehicles.length === 0) return [];

    // Get all months
    const meses = new Set<string>();
    data.forEach((d) => meses.add(d.Mês));
    const sortedMeses = Array.from(meses).sort((a, b) => {
      const [mesA, anoA] = a.split("/");
      const [mesB, anoB] = b.split("/");
      return anoA.localeCompare(anoB) || mesA.localeCompare(mesB);
    });

    // Build chart data
    return sortedMeses.map((mes) => {
      const point: Record<string, string | number> = { mes };
      selectedVehicles.forEach((veiculo) => {
        const record = data.find((d) => d.Veículo === veiculo && d.Mês === mes);
        point[veiculo] = record ? record.mediaCarregadoNum : 0;
      });
      return point;
    });
  }, [data, selectedVehicles]);

  const toggleVehicle = (veiculo: string) => {
    setSelectedVehicles((prev) => {
      if (prev.includes(veiculo)) {
        return prev.filter((v) => v !== veiculo);
      }
      if (prev.length >= 5) {
        return prev;
      }
      return [...prev, veiculo];
    });
  };

  const removeVehicle = (veiculo: string) => {
    setSelectedVehicles((prev) => prev.filter((v) => v !== veiculo));
  };

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary/10">
          <GitCompare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Comparador de Veículos</h3>
          <p className="text-xs text-muted-foreground">Compare até 5 veículos lado a lado</p>
        </div>
      </div>

      {/* Vehicle Selector */}
      <div className="mb-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted transition-colors">
              <span className="text-sm text-muted-foreground">
                {selectedVehicles.length === 0
                  ? "Selecione veículos para comparar..."
                  : `${selectedVehicles.length} veículo(s) selecionado(s)`}
              </span>
              <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar veículo..." />
              <CommandList>
                <CommandEmpty>Nenhum veículo encontrado.</CommandEmpty>
                <CommandGroup>
                  {vehicles.map((v) => (
                    <CommandItem
                      key={v.veiculo}
                      value={v.veiculo}
                      onSelect={() => toggleVehicle(v.veiculo)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedVehicles.includes(v.veiculo) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <span className="font-medium">{v.veiculo}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {v.marca} • {v.modelo}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected vehicles chips */}
      {selectedVehicles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedVehicles.map((veiculo, idx) => (
            <span
              key={veiculo}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${COLORS[idx]}20`,
                color: COLORS[idx],
              }}
            >
              {veiculo}
              <button
                onClick={() => removeVehicle(veiculo)}
                className="ml-1 hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Chart */}
      {selectedVehicles.length > 0 ? (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="mes"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `${value.toFixed(1)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [formatNumber(value, 2) + " km/l"]}
              />
              <Legend />
              {selectedVehicles.map((veiculo, idx) => (
                <Line
                  key={veiculo}
                  type="monotone"
                  dataKey={veiculo}
                  stroke={COLORS[idx]}
                  strokeWidth={2}
                  dot={{ fill: COLORS[idx], strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <GitCompare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Selecione veículos para comparar</p>
          </div>
        </div>
      )}
    </div>
  );
}
