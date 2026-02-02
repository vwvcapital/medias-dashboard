import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { TrendData } from "@/utils/analysisUtils";
import { formatNumber } from "@/utils/fleetUtils";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  data: TrendData[];
}

export function TrendIndicator({ data }: TrendIndicatorProps) {
  const improving = data.filter((d) => d.tendencia === "up");
  const declining = data.filter((d) => d.tendencia === "down");

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-accent/10">
          <TrendingUp className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Indicadores de Tendência</h3>
          <p className="text-xs text-muted-foreground">Mês atual vs média dos últimos 3 meses</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-xl bg-accent/10 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-2xl font-bold text-accent">{improving.length}</span>
          </div>
          <p className="text-xs text-muted-foreground">Melhorando</p>
        </div>
        <div className="p-3 rounded-xl bg-destructive/10 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className="text-2xl font-bold text-destructive">{declining.length}</span>
          </div>
          <p className="text-xs text-muted-foreground">Piorando</p>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {data.slice(0, 15).map((vehicle) => (
          <div
            key={vehicle.veiculo}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              {vehicle.tendencia === "up" && (
                <TrendingUp className="w-4 h-4 text-accent" />
              )}
              {vehicle.tendencia === "down" && (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
              {vehicle.tendencia === "stable" && (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-foreground">{vehicle.veiculo}</p>
                <p className="text-xs text-muted-foreground">
                  {vehicle.marca} • {vehicle.modelo}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "font-bold",
                vehicle.tendencia === "up" && "text-accent",
                vehicle.tendencia === "down" && "text-destructive",
                vehicle.tendencia === "stable" && "text-muted-foreground"
              )}>
                {vehicle.variacao > 0 ? "+" : ""}{formatNumber(vehicle.variacao, 1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(vehicle.mediaAtual, 2)} km/l
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
