import { useMemo, useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, Search, Download, Printer, X } from "lucide-react";
import { ProcessedFleetData } from "@/types/fleet";
import { formatNumber } from "@/utils/fleetUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import html2canvas from "html2canvas";

interface VehiclePerformanceChartProps {
  data: ProcessedFleetData[];
}

export function VehiclePerformanceChart({ data }: VehiclePerformanceChartProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Get unique vehicles with their info
  const vehicles = useMemo(() => {
    const vehicleMap = new Map<string, { marca: string; modelo: string; grupo: string }>();
    data.forEach((d) => {
      if (!vehicleMap.has(d.Veículo)) {
        vehicleMap.set(d.Veículo, {
          marca: d.Marca,
          modelo: d.Modelo,
          grupo: d.Grupo,
        });
      }
    });
    return Array.from(vehicleMap.entries())
      .map(([veiculo, info]) => ({ veiculo, ...info }))
      .sort((a, b) => a.veiculo.localeCompare(b.veiculo));
  }, [data]);

  // Get monthly data for selected vehicle
  const vehicleData = useMemo(() => {
    if (!selectedVehicle) return [];
    
    return data
      .filter((d) => d.Veículo === selectedVehicle)
      .map((d) => ({
        mes: d.Mês,
        mediaCarregado: d.mediaCarregadoNum,
        kmRodado: d["KM Rodado"],
        kmCarregado: d["KM Rodado Carregado"],
      }))
      .sort((a, b) => {
        const [mesA, anoA] = a.mes.split("/");
        const [mesB, anoB] = b.mes.split("/");
        return anoA.localeCompare(anoB) || mesA.localeCompare(mesB);
      });
  }, [data, selectedVehicle]);

  // Calculate average for reference line
  const averageMedia = useMemo(() => {
    if (vehicleData.length === 0) return 0;
    return vehicleData.reduce((acc, d) => acc + d.mediaCarregado, 0) / vehicleData.length;
  }, [vehicleData]);

  // Get vehicle info
  const vehicleInfo = useMemo(() => {
    return vehicles.find((v) => v.veiculo === selectedVehicle);
  }, [vehicles, selectedVehicle]);

  // Handle save as image
  const handleSaveImage = async () => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#1a1a2e",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `desempenho-${selectedVehicle || "veiculo"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Erro ao salvar imagem:", error);
    }
  };

  // Handle print
  const handlePrint = () => {
    if (!chartRef.current) return;
    
    html2canvas(chartRef.current, {
      backgroundColor: "#1a1a2e",
      scale: 2,
    }).then((canvas) => {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Desempenho - ${selectedVehicle || "Veículo"}</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                img { max-width: 100%; height: auto; }
              </style>
            </head>
            <body>
              <img src="${canvas.toDataURL("image/png")}" />
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    });
  };

  return (
    <div className="glass-card rounded-2xl p-6 animate-slide-up w-full" style={{ animationDelay: "350ms" }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Desempenho Individual</h3>
            <p className="text-sm text-muted-foreground">Visualize a evolução de um veículo específico</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[200px] justify-between"
              >
                {selectedVehicle ? selectedVehicle : "Selecione um veículo"}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Buscar veículo..." />
                <CommandList>
                  <CommandEmpty>Nenhum veículo encontrado.</CommandEmpty>
                  <CommandGroup>
                    {vehicles.map((vehicle) => (
                      <CommandItem
                        key={vehicle.veiculo}
                        value={vehicle.veiculo}
                        onSelect={(value) => {
                          setSelectedVehicle(value === selectedVehicle ? null : value);
                          setOpen(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{vehicle.veiculo}</span>
                          <span className="text-xs text-muted-foreground">{vehicle.grupo}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedVehicle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedVehicle(null)}
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {selectedVehicle && vehicleInfo ? (
        <div ref={chartRef} className="bg-card rounded-xl p-4">
          {/* Vehicle Info Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-foreground">{selectedVehicle}</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                  {vehicleInfo.grupo}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {vehicleInfo.marca} • {vehicleInfo.modelo}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{formatNumber(averageMedia)}</p>
                <p className="text-xs text-muted-foreground">Média km/l</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{vehicleData.length}</p>
                <p className="text-xs text-muted-foreground">Meses</p>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vehicleData} margin={{ left: 0, right: 20, top: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorVehicle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="mes"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  domain={["dataMin - 0.3", "dataMax + 0.3"]}
                  tickFormatter={(value: number) => value.toFixed(2)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length > 0) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
                          <div className="font-medium mb-2">{label}</div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">Média Carregado:</span>
                              <span className="font-bold text-primary">{formatNumber(d.mediaCarregado)} km/l</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">KM Rodado:</span>
                              <span className="font-medium">{d.kmRodado.toLocaleString("pt-BR")}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-muted-foreground">KM Carregado:</span>
                              <span className="font-medium">{d.kmCarregado.toLocaleString("pt-BR")}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={averageMedia}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  label={{
                    value: `Média: ${formatNumber(averageMedia)}`,
                    position: "right",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mediaCarregado"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                  activeDot={{ r: 7, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={handleSaveImage}>
              <Download className="w-4 h-4 mr-2" />
              Salvar Imagem
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Search className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Selecione um veículo</p>
          <p className="text-sm">Escolha um veículo para visualizar seu desempenho ao longo do tempo</p>
        </div>
      )}
    </div>
  );
}
