import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router";
import BaseChart from "../../components/charts/BaseChart";
import NavigationBar from "../../components/NavigationBar";
import Sidebar from "../../components/charts/Sidebar";
import { ChartProvider } from "../../components/charts/chartContext";
import type { BaseChartRef } from "../../components/charts/BaseChart";

interface CSVDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

import type { DataPoint } from "../../components/charts/types";

function Pairs() {
  const { pair } = useParams<{ pair: string }>();
  const [data, setData] = useState<CSVDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPair, setCurrentPair] = useState(pair || "EURUSD");
  const chartRef = useRef<BaseChartRef>(null);
  const [activeTool, setActiveTool] = useState<string>("none");

  useEffect(() => {
    const fetchCSVData = async () => {
      try {
        const response = await fetch("/src/data/EURUSD.csv");
        const csvText = await response.text();

        if (!csvText.trim()) {
          console.warn("CSV file is empty, using mock data");
          setData([]);
          setLoading(false);
          return;
        }

        // Parse CSV data
        const lines = csvText.trim().split("\n");
        // Skip header line and parse data

        const parsedData: CSVDataPoint[] = lines.slice(1).map((line) => {
          const values = line.split(",");

          // CSV format: time,open,high,low,close,tick_volume,spread,real_volume
          // time is Unix timestamp in seconds
          const timestamp = parseInt(values[0]);
          const date = new Date(timestamp * 1000);

          return {
            date: date, // Convert Unix seconds to milliseconds
            open: parseFloat(values[1]),
            high: parseFloat(values[2]),
            low: parseFloat(values[3]),
            close: parseFloat(values[4]),
          };
        });

        // Limit to 2k candlesticks for better performance
        const limitedData = parsedData.slice(-2000);

        setData(limitedData);
      } catch (err) {
        console.error("Error fetching CSV data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchCSVData();
  }, []);

  // Memoize chart data transformation to prevent unnecessary re-renders
  const chartData = useMemo((): DataPoint[] => {
    return data.map((d) => ({
      time: d.date.getTime() / 1000, // Unix timestamp in seconds
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
  }, [data]);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading chart data...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          height: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Error: {error}
      </div>
    );
  }

  const handlePairChange = (newPair: string) => {
    setCurrentPair(newPair);
    // In a real app, this would navigate to the new pair route
    // For now, we'll just update the state
  };

  const handleResetZoom = () => {
    console.log("Reset zoom clicked");
    chartRef.current?.resetZoom();
  };

  const handleToggleCrosshair = () => {
    // Simple crosshair toggle - just show an alert for now
    alert("Crosshair functionality coming soon!");
  };

  const handleClearMarkers = () => {
    chartRef.current?.clearMarkers();
  };

  const handleToggleDotMode = () => {
    const newTool = activeTool === "none" ? "dot" : "none";
    setActiveTool(newTool);
    console.log("Active tool set to:", newTool);
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <NavigationBar
        currentPair={currentPair}
        onPairChange={handlePairChange}
      />
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ display: "flex", height: "100%", width: "100%" }}>
          <Sidebar
            onResetZoom={handleResetZoom}
            onToggleCrosshair={handleToggleCrosshair}
            onToggleDotMode={handleToggleDotMode}
            onClearMarkers={handleClearMarkers}
          />

          {/* Chart Area */}
          <div
            style={{
              flex: 1,
              marginLeft: "8px",
              position: "relative",
              height: "100%",
              display: "flex",
            }}
          >
            <div style={{ flex: 1, position: "relative" }}>
              <ChartProvider>
                <BaseChart
                  ref={chartRef}
                  data={chartData}
                  activeTool={activeTool}
                  onChartCreated={(newChart) => {
                    console.log("Chart created:", newChart);
                  }}
                />
              </ChartProvider>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pairs;
