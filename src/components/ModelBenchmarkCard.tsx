import { Target, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { ModelBenchmark } from "@/utils/analysisUtils";
import { formatNumber } from "@/utils/fleetUtils";
import { cn } from "@/lib/utils";

interface ModelBenchmarkCardProps {
  data: ModelBenchmark[];
}

export function ModelBenchmarkCard({ data }: ModelBenchmarkCardProps) {
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());

  const toggleExpand = (modelo: string) => {
    setExpandedModels((prev) => {
      const next = new Set(prev);
      if (next.has(modelo)) {
        next.delete(modelo);
      } else {
        next.add(modelo);
      }
      return next;
    });
  };

  const totalVehiclesBelow = data.reduce((sum, m) => sum + m.veiculosAbaixo.length, 0);

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-accent/10">
          <Target className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Benchmark por Modelo</h3>
          <p className="text-xs text-muted-foreground">Veículos abaixo da média do modelo</p>
        </div>
        {totalVehiclesBelow > 0 && (
          <span className="ml-auto px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
            {totalVehiclesBelow} abaixo
          </span>
        )}
      </div>

      {data.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.map((model) => (
            <div key={model.modelo} className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => toggleExpand(model.modelo)}
                className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-foreground text-left">{model.modelo}</p>
                    <p className="text-xs text-muted-foreground">{model.marca}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      Benchmark: {formatNumber(model.mediaBenchmark, 2)} km/l
                    </p>
                    <p className="text-xs text-warning">
                      {model.veiculosAbaixo.length} veículo(s) abaixo
                    </p>
                  </div>
                  {expandedModels.has(model.modelo) ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedModels.has(model.modelo) && (
                <div className="p-3 bg-background space-y-2">
                  {model.veiculosAbaixo.map((v) => (
                    <div
                      key={v.veiculo}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                    >
                      <span className="font-medium text-foreground">{v.veiculo}</span>
                      <div className="text-right">
                        <span className="text-sm text-foreground">
                          {formatNumber(v.media, 2)} km/l
                        </span>
                        <span className={cn(
                          "ml-2 text-xs font-medium",
                          "text-destructive"
                        )}>
                          ({formatNumber(v.diferenca, 2)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Todos os veículos atingem o benchmark!</p>
        </div>
      )}
    </div>
  );
}
