import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { ProcessedFleetData } from "@/types/fleet";
import { formatNumber } from "@/utils/fleetUtils";
import { cn } from "@/lib/utils";

interface VehicleRankingProps {
  vehicles: ProcessedFleetData[];
}

export function VehicleRanking({ vehicles }: VehicleRankingProps) {
  const avgMedia = vehicles.reduce((acc, v) => acc + v.mediaCarregadoNum, 0) / vehicles.length;

  return (
    <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Ranking de Veículos</h3>
          <p className="text-sm text-muted-foreground">Por média carregado (km/l)</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {vehicles.slice(0, 10).map((vehicle, index) => {
          const isAboveAvg = vehicle.mediaCarregadoNum >= avgMedia;
          
          return (
            <div
              key={vehicle.Veículo}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors min-w-[120px] flex-shrink-0",
                index === 0 && "bg-accent/10 border border-accent/20",
                index > 0 && "hover:bg-secondary/50 bg-secondary/30"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                  index === 0 && "bg-accent text-accent-foreground",
                  index === 1 && "bg-muted text-muted-foreground",
                  index === 2 && "bg-warning/20 text-warning",
                  index > 2 && "bg-secondary text-secondary-foreground"
                )}
              >
                {index + 1}
              </div>

              <div className="text-center min-w-0">
                <div className="font-semibold text-sm truncate max-w-[100px]">{vehicle.Veículo}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {vehicle.Marca}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {isAboveAvg ? (
                  <TrendingUp className="w-3 h-3 text-accent" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-destructive" />
                )}
                <span
                  className={cn(
                    "font-bold text-sm",
                    isAboveAvg ? "text-accent" : "text-destructive"
                  )}
                >
                  {formatNumber(vehicle.mediaCarregadoNum)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
