import { AlertOctagon, ChevronRight } from "lucide-react";
import { AttentionVehicle } from "@/utils/analysisUtils";
import { cn } from "@/lib/utils";

interface AttentionReportProps {
  data: AttentionVehicle[];
}

export function AttentionReport({ data }: AttentionReportProps) {
  const alta = data.filter((d) => d.prioridade === "alta");
  const media = data.filter((d) => d.prioridade === "media");

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-destructive/10">
          <AlertOctagon className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Relatório de Atenção</h3>
          <p className="text-xs text-muted-foreground">Veículos que precisam de atenção</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {alta.length > 0 && (
            <span className="px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
              {alta.length} alta
            </span>
          )}
          {media.length > 0 && (
            <span className="px-2 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
              {media.length} média
            </span>
          )}
        </div>
      </div>

      {data.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.slice(0, 15).map((vehicle) => (
            <div
              key={vehicle.veiculo}
              className={cn(
                "p-4 rounded-xl border",
                vehicle.prioridade === "alta" && "bg-destructive/5 border-destructive/30",
                vehicle.prioridade === "media" && "bg-warning/5 border-warning/30",
                vehicle.prioridade === "baixa" && "bg-muted/50 border-border"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full mt-2",
                  vehicle.prioridade === "alta" && "bg-destructive",
                  vehicle.prioridade === "media" && "bg-warning",
                  vehicle.prioridade === "baixa" && "bg-muted-foreground"
                )} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-foreground">{vehicle.veiculo}</span>
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      vehicle.prioridade === "alta" && "bg-destructive/20 text-destructive",
                      vehicle.prioridade === "media" && "bg-warning/20 text-warning",
                      vehicle.prioridade === "baixa" && "bg-muted text-muted-foreground"
                    )}>
                      Prioridade {vehicle.prioridade}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {vehicle.marca} • {vehicle.modelo} • {vehicle.grupo}
                  </p>
                  <div className="space-y-1">
                    {vehicle.problemas.map((problema, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-foreground">{problema}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <AlertOctagon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum veículo precisa de atenção!</p>
          <p className="text-xs mt-1">Todos os veículos estão performando bem</p>
        </div>
      )}
    </div>
  );
}
