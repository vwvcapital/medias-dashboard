import { TruckIcon, AlertTriangle } from "lucide-react";
import { LoadEfficiencyData } from "@/utils/analysisUtils";
import { formatNumber } from "@/utils/fleetUtils";

interface LoadEfficiencyCardProps {
  data: LoadEfficiencyData[];
}

export function LoadEfficiencyCard({ data }: LoadEfficiencyCardProps) {
  const lowEfficiency = data.filter((d) => d.eficiencia < 75);
  const avgEfficiency = data.reduce((sum, d) => sum + d.eficiencia, 0) / data.length;

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-warning/10">
          <TruckIcon className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Eficiência de Carga</h3>
          <p className="text-xs text-muted-foreground">KM Carregado vs KM Total</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-2xl font-bold text-foreground">{formatNumber(avgEfficiency, 1)}%</p>
          <p className="text-xs text-muted-foreground">Média da frota</p>
        </div>
      </div>

      {lowEfficiency.length > 0 ? (
        <>
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-warning/10">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-sm text-warning font-medium">
              {lowEfficiency.length} veículos com baixa eficiência (&lt;75%)
            </span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {lowEfficiency.slice(0, 10).map((vehicle, idx) => (
              <div
                key={vehicle.veiculo}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-6">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{vehicle.veiculo}</p>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.marca} • {vehicle.modelo}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-destructive">
                    {formatNumber(vehicle.eficiencia, 1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(vehicle.kmVazio, 0)} km vazio
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <TruckIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Todos os veículos com boa eficiência!</p>
        </div>
      )}
    </div>
  );
}
