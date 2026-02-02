import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, Cloud, Loader2 } from "lucide-react";
import { FleetData } from "@/types/fleet";
import { fetchGoogleSheetsData, parseXLSXFile, parseJSONFile } from "@/utils/dataLoader";

interface FileUploadProps {
  onDataLoaded: (data: FleetData[]) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const handleGoogleSheetsSync = async () => {
    setIsLoading(true);
    setLoadingText("Sincronizando com Google Sheets...");
    
    try {
      const data = await fetchGoogleSheetsData();
      onDataLoaded(data);
    } catch (error) {
      alert("Erro ao sincronizar com Google Sheets. Verifique se a planilha está pública.");
    } finally {
      setIsLoading(false);
      setLoadingText("");
    }
  };

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setLoadingText("Processando arquivo...");

      try {
        let data: FleetData[];
        
        if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          data = await parseXLSXFile(file);
        } else if (file.name.endsWith(".json")) {
          data = await parseJSONFile(file);
        } else {
          throw new Error("Formato não suportado. Use .xlsx, .xls ou .json");
        }
        
        onDataLoaded(data);
      } catch (error: any) {
        alert(error.message || "Erro ao processar arquivo");
      } finally {
        setIsLoading(false);
        setLoadingText("");
      }
    },
    [onDataLoaded]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setLoadingText("Processando arquivo...");

      try {
        let data: FleetData[];
        
        if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          data = await parseXLSXFile(file);
        } else if (file.name.endsWith(".json")) {
          data = await parseJSONFile(file);
        } else {
          throw new Error("Formato não suportado. Use .xlsx, .xls ou .json");
        }
        
        onDataLoaded(data);
      } catch (error: any) {
        alert(error.message || "Erro ao processar arquivo");
      } finally {
        setIsLoading(false);
        setLoadingText("");
      }
    },
    [onDataLoaded]
  );

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div
        className="glass-card rounded-2xl p-8 md:p-12 max-w-2xl w-full text-center animate-scale-in"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
          <FileSpreadsheet className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold mb-3">Painel de Frota</h1>
        <p className="text-muted-foreground mb-8">
          Carregue seus dados para visualizar o painel de desempenho da frota
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground">{loadingText}</p>
          </div>
        ) : (
          <>
            {/* Google Sheets Sync Button */}
            <button
              onClick={handleGoogleSheetsSync}
              className="w-full mb-4 inline-flex items-center justify-center gap-3 px-8 py-4 bg-accent text-accent-foreground rounded-xl font-semibold transition-all duration-200 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/25"
            >
              <Cloud className="w-5 h-5" />
              Sincronizar com Google Sheets
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">ou</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* File Upload */}
            <label className="block cursor-pointer">
              <input
                type="file"
                accept=".json,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="inline-flex items-center justify-center gap-3 w-full px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25">
                <Upload className="w-5 h-5" />
                Enviar Arquivo (XLSX ou JSON)
              </div>
            </label>

            <p className="text-sm text-muted-foreground mt-6">
              Arraste e solte seu arquivo aqui
            </p>
          </>
        )}
      </div>
    </div>
  );
}
