import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { Dashboard } from "@/components/Dashboard";
import { FleetData, ProcessedFleetData } from "@/types/fleet";
import { parseFleetData } from "@/utils/fleetUtils";

const Index = () => {
  const [data, setData] = useState<ProcessedFleetData[] | null>(null);

  const handleDataLoaded = (rawData: FleetData[]) => {
    const processed = parseFleetData(rawData);
    setData(processed);
  };

  const handleReset = () => {
    setData(null);
  };

  if (!data) {
    return <FileUpload onDataLoaded={handleDataLoaded} />;
  }

  return <Dashboard data={data} onReset={handleReset} onDataUpdate={handleDataLoaded} />;
};

export default Index;
