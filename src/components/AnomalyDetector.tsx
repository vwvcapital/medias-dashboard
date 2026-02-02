import { AlertTriangle, TrendingDown } from "lucide-react";
import { AnomalyData } from "@/utils/analysisUtils";
import { formatNumber } from "@/utils/fleetUtils";

interface AnomalyDetectorProps {
  data: AnomalyData[];
}

export function AnomalyDetector({ data }: AnomalyDetectorProps) {
  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-destructive/10">
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Detector de Anomalias</h3>
          <p className="text-xs text-muted-foreground">Quedas bruscas de performance</p>
        </div>
        {data.length > 0 && (
          <span className="ml-auto px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
            {data.length} alertas
          </span>
        )}
      </div>

      {data.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {data.map((anomaly) => (
            <div
              key={anomaly.veiculo}
              className="p-4 rounded-xl bg-destructive/5 border border-destructive/20"
            >
              <div className="flex items-start gap-3">
                <TrendingDown className="w-5 h-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground">{anomaly.veiculo}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-medium">
                      {formatNumber(anomaly.variacao, 0)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {anomaly.marca} • {anomaly.modelo} • {anomaly.grupo}
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Histórico: <strong className="text-foreground">{formatNumber(anomaly.mediaHistorica, 2)} km/l</strong>
                    </span>
                    <span className="text-destructive">
                      {anomaly.mesAtual}: <strong>{formatNumber(anomaly.valorAtual, 2)} km/l</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma anomalia detectada!</p>
          <p className="text-xs mt-1">Todos os veículos mantêm performance estável</p>
        </div>
      )}
    </div>
  );
}
