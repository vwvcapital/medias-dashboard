"use client";

import { useState, useEffect } from "react";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ProcessedFleetData } from "@/types/fleet";
import { parseFleetData } from "@/utils/fleetUtils";
import { fetchGoogleSheetsData } from "@/utils/dataLoader";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
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
    } catch {
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full border-border/50">
          <CardContent className="p-8 md:p-12 text-center">
            <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <h2 className="text-xl font-bold mb-2">Carregando dados...</h2>
            <p className="text-muted-foreground text-sm">Sincronizando com Google Sheets</p>
            <div className="mt-6 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1.5 w-8 rounded-full bg-primary/20 overflow-hidden"
                >
                  <div
                    className="h-full bg-primary rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full border-destructive/20">
          <CardContent className="p-8 md:p-12 text-center">
            <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Erro ao carregar</h2>
            <p className="text-muted-foreground text-sm mb-6">{error}</p>
            <Button onClick={loadData} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return <Dashboard data={data} />;
}
