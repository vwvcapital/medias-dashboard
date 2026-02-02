import { useState, useEffect } from "react";
import { Dashboard } from "@/components/Dashboard";
import { ProcessedFleetData } from "@/types/fleet";
import { parseFleetData } from "@/utils/fleetUtils";
import { fetchGoogleSheetsData } from "@/utils/dataLoader";
import { Loader2, RefreshCw } from "lucide-react";

const Index = () => {
  const [data, setData] = useState<ProcessedFleetData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const rawData = await fetchGoogleSheetsData();
      const processed = parseFleetData(rawData);
      setData(processed);
    } catch (err) {
      setError("Erro ao sincronizar com Google Sheets. Verifique se a planilha está acessível.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 md:p-12 max-w-md w-full text-center animate-scale-in">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Carregando dados...</h2>
          <p className="text-muted-foreground">Sincronizando com Google Sheets</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 md:p-12 max-w-md w-full text-center animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={loadData}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold transition-all hover:bg-primary/90"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return <Dashboard data={data} />;
};

export default Index;
