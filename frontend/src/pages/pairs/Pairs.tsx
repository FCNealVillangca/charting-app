import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router";
import BaseChart from "../../components/charts/BaseChart";
import NavigationBar from "../../components/NavigationBar";
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
          {/* Sidebar */}
          <div
            style={{
              width: "48px",
              padding: "8px",
              borderRight: "1px solid #ccc",
              backgroundColor: "#f5f5f5",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Chart Tools */}
            <div style={{ marginBottom: "8px" }}>
              <button
                style={{
                  width: "32px",
                  height: "32px",
                  borderTop: "1px solid #ccc",
                  borderRight: "1px solid #ccc",
                  borderBottom: "1px solid #ccc",
                  borderLeft: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  margin: "2px",
                }}
                title="Crosshair"
                onClick={handleToggleCrosshair}
              >
                ✚
              </button>
            </div>

            {/* Essential Chart Controls */}
            <div style={{ marginBottom: "8px" }}>
              <button
                style={{
                  width: "32px",
                  height: "32px",
                  borderTop: "1px solid #ccc",
                  borderRight: "1px solid #ccc",
                  borderBottom: "1px solid #ccc",
                  borderLeft: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  margin: "2px",
                }}
                title="Reset Zoom"
                onClick={handleResetZoom}
              >
                🔄
              </button>
            </div>

            {/* Help */}
            <div>
              <button
                style={{
                  width: "32px",
                  height: "32px",
                  borderTop: "1px solid #ccc",
                  borderRight: "1px solid #ccc",
                  borderBottom: "1px solid #ccc",
                  borderLeft: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  margin: "2px",
                }}
                title="Keyboard Shortcuts: + = Zoom In, - = Zoom Out, 0 = Reset, ← → = Pan"
                onClick={() =>
                  alert(
                    "Keyboard Shortcuts:\n+ = Zoom In\n- = Zoom Out\n0 = Reset Zoom\n← → = Pan Left/Right"
                  )
                }
              >
                ❓
              </button>
            </div>
          </div>

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
              <BaseChart
                ref={chartRef}
                data={chartData}
                onChartCreated={(newChart) => {
                  console.log("Chart created:", newChart);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pairs;
