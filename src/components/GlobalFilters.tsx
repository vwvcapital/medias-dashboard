import { useState, useMemo } from "react";
import { Calendar, Search, X, Filter, Download, FileSpreadsheet } from "lucide-react";
import { ProcessedFleetData } from "@/types/fleet";
import { getUniqueVehicles } from "@/utils/analysisUtils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface GlobalFiltersProps {
  data: ProcessedFleetData[];
  onFilterChange: (filteredData: ProcessedFleetData[]) => void;
  onVehicleSelect: (vehicle: string | null) => void;
  selectedVehicle: string | null;
}

export function GlobalFilters({
  data,
  onFilterChange,
  onVehicleSelect,
  selectedVehicle,
}: GlobalFiltersProps) {
  const [startMonth, setStartMonth] = useState<string>("");
  const [endMonth, setEndMonth] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [periodPreset, setPeriodPreset] = useState<string>("");

  const vehicles = useMemo(() => getUniqueVehicles(data), [data]);

  const months = useMemo(() => {
    const mesesSet = new Set<string>();
    data.forEach((item) => mesesSet.add(item.Mês));
    return Array.from(mesesSet).sort((a, b) => {
      const [mesA, anoA] = a.split("/");
      const [mesB, anoB] = b.split("/");
      return anoA.localeCompare(anoB) || mesA.localeCompare(mesB);
    });
  }, [data]);

  const applyFilters = (start: string, end: string, vehicle: string | null) => {
    let filtered = [...data];

    if (start || end) {
      filtered = filtered.filter((item) => {
        const [mes, ano] = item.Mês.split("/");
        const itemDate = new Date(parseInt(`20${ano}`), parseInt(mes) - 1, 1);

        if (start) {
          const [startMes, startAno] = start.split("/");
          const startDate = new Date(parseInt(`20${startAno}`), parseInt(startMes) - 1, 1);
          if (itemDate < startDate) return false;
        }

        if (end) {
          const [endMes, endAno] = end.split("/");
          const endDate = new Date(parseInt(`20${endAno}`), parseInt(endMes) - 1, 1);
          if (itemDate > endDate) return false;
        }

        return true;
      });
    }

    if (vehicle) {
      filtered = filtered.filter((item) => item.Veículo === vehicle);
    }

    onFilterChange(filtered);
  };

  const handlePeriodPreset = (preset: string) => {
    setPeriodPreset(preset);
    const sortedMonths = [...months];
    
    if (sortedMonths.length === 0) return;

    let start = "";
    const end = sortedMonths[sortedMonths.length - 1];

    switch (preset) {
      case "3m":
        start = sortedMonths[Math.max(0, sortedMonths.length - 3)];
        break;
      case "6m":
        start = sortedMonths[Math.max(0, sortedMonths.length - 6)];
        break;
      case "12m":
        start = sortedMonths[Math.max(0, sortedMonths.length - 12)];
        break;
      case "all":
        start = "";
        break;
    }

    setStartMonth(start);
    setEndMonth(preset === "all" ? "" : end);
    applyFilters(start, preset === "all" ? "" : end, selectedVehicle);
  };

  const clearFilters = () => {
    setStartMonth("");
    setEndMonth("");
    setPeriodPreset("");
    onVehicleSelect(null);
    onFilterChange(data);
  };

  const exportToExcel = () => {
    const exportData = data.map((item) => ({
      Mês: item.Mês,
      Veículo: item.Veículo,
      Marca: item.Marca,
      Modelo: item.Modelo,
      Grupo: item.Grupo,
      "KM Rodado": item["KM Rodado"],
      "KM Rodado Carregado": item["KM Rodado Carregado"],
      Média: item.Média,
      "Média Carregado": item["Média Carregado"],
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    XLSX.writeFile(wb, `frota_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const hasFilters = startMonth || endMonth || selectedVehicle;

  return (
    <div className="glass-card rounded-2xl p-4 mb-6 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        {/* Period Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Período:</span>
        </div>

        <div className="flex items-center gap-1">
          {[
            { value: "3m", label: "3M" },
            { value: "6m", label: "6M" },
            { value: "12m", label: "12M" },
            { value: "all", label: "Tudo" },
          ].map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePeriodPreset(preset.value)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-lg transition-colors",
                periodPreset === preset.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={startMonth}
            onChange={(e) => {
              setStartMonth(e.target.value);
              setPeriodPreset("");
              applyFilters(e.target.value, endMonth, selectedVehicle);
            }}
            className="px-3 py-1.5 text-sm rounded-lg bg-muted border-none focus:ring-2 focus:ring-primary"
          >
            <option value="">De...</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <span className="text-muted-foreground">até</span>
          <select
            value={endMonth}
            onChange={(e) => {
              setEndMonth(e.target.value);
              setPeriodPreset("");
              applyFilters(startMonth, e.target.value, selectedVehicle);
            }}
            className="px-3 py-1.5 text-sm rounded-lg bg-muted border-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Até...</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-2 hidden sm:block" />

        {/* Vehicle Search */}
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
              <Search className="w-4 h-4" />
              <span className="text-sm">
                {selectedVehicle || "Buscar veículo..."}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Digite a placa..." />
              <CommandList>
                <CommandEmpty>Nenhum veículo encontrado.</CommandEmpty>
                <CommandGroup>
                  {vehicles.map((v) => (
                    <CommandItem
                      key={v.veiculo}
                      value={v.veiculo}
                      onSelect={() => {
                        onVehicleSelect(v.veiculo);
                        applyFilters(startMonth, endMonth, v.veiculo);
                        setSearchOpen(false);
                      }}
                    >
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

        {/* Clear Filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="w-4 h-4" />
            Limpar
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export Button */}
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">Exportar Excel</span>
        </button>
      </div>

      {/* Active filters summary */}
      {hasFilters && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {startMonth && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
              De: {startMonth}
            </span>
          )}
          {endMonth && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
              Até: {endMonth}
            </span>
          )}
          {selectedVehicle && (
            <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">
              Veículo: {selectedVehicle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
