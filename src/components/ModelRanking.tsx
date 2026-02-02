import { Trophy, TrendingDown } from "lucide-react";
import { formatNumber } from "@/utils/fleetUtils";

interface ModelStats {
  modelo: string;
  marca: string;
  mediaCarregado: number;
  count: number;
}

interface ModelRankingProps {
  models: ModelStats[];
}

export function ModelRanking({ models }: ModelRankingProps) {
  const topModels = models.slice(0, 5);
  const worstModels = models.slice(-5).reverse();
  
  // Use separate max values for each list to normalize bars within their own context
  const topMaxMedia = topModels[0]?.mediaCarregado || 1;
  const worstMaxMedia = worstModels[0]?.mediaCarregado || 1;

  const renderModelList = (
    items: ModelStats[],
    isTop: boolean,
    maxMedia: number
  ) => (
    <div className="space-y-3">
      {items.map((model, index) => {
        // Normalize within the list's own range for consistent visual representation
        const percentage = (model.mediaCarregado / maxMedia) * 100;

        return (
          <div key={model.modelo} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                isTop
                  ? "bg-accent text-accent-foreground"
                  : "bg-destructive/20 text-destructive"
              }`}
            >
              {isTop ? (index === 0 ? <Trophy className="w-4 h-4" /> : index + 1) : index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm truncate pr-2" title={model.modelo}>
                  {model.modelo}
                </span>
                <span className={`font-bold text-sm whitespace-nowrap ${isTop ? "text-primary" : "text-destructive"}`}>
                  {formatNumber(model.mediaCarregado)} km/l
                </span>
              </div>

              <div className="flex justify-between items-center mb-1">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden mr-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTop ? "bg-accent" : "bg-destructive/60"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {model.marca}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-6 animate-slide-up">
      <h3 className="font-semibold text-lg mb-6">Desempenho por Modelo</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="font-medium text-sm">5 Melhores</span>
          </div>
          {renderModelList(topModels, true, topMaxMedia)}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className="font-medium text-sm">5 Piores</span>
          </div>
          {renderModelList(worstModels, false, worstMaxMedia)}
        </div>
      </div>
    </div>
  );
}
