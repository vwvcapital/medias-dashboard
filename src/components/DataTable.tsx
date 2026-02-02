import { useState } from "react";
import { ProcessedFleetData } from "@/types/fleet";
import { formatNumber, formatKm } from "@/utils/fleetUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileSpreadsheet, ChevronDown, ChevronUp } from "lucide-react";

interface DataTableProps {
  data: ProcessedFleetData[];
}

export function DataTable({ data }: DataTableProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "500ms" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Dados Detalhados</h3>
            <p className="text-sm text-muted-foreground">{data.length} registros carregados</p>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl font-medium transition-colors hover:bg-secondary/80"
        >
          {isVisible ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Ocultar
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Mostrar
            </>
          )}
        </button>
      </div>

      {isVisible && (
        <div className="overflow-x-auto rounded-xl border border-border mt-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead className="font-semibold">Mês</TableHead>
                <TableHead className="font-semibold">Veículo</TableHead>
                <TableHead className="font-semibold">Marca</TableHead>
                <TableHead className="font-semibold">Grupo</TableHead>
                <TableHead className="font-semibold text-right">KM Rodado</TableHead>
                <TableHead className="font-semibold text-right">KM Carregado</TableHead>
                <TableHead className="font-semibold text-right">Média</TableHead>
                <TableHead className="font-semibold text-right">Média Carregado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={`${row.Veículo}-${row.Mês}-${index}`} className="hover:bg-secondary/30">
                  <TableCell>{row.Mês}</TableCell>
                  <TableCell className="font-medium">{row.Veículo}</TableCell>
                  <TableCell className="text-muted-foreground">{row.Marca}</TableCell>
                  <TableCell>{row.Grupo}</TableCell>
                  <TableCell className="text-right">{formatKm(row["KM Rodado"])}</TableCell>
                  <TableCell className="text-right">{formatKm(row["KM Rodado Carregado"])}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.mediaNum)}</TableCell>
                  <TableCell className="text-right font-semibold text-accent">
                    {formatNumber(row.mediaCarregadoNum)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
