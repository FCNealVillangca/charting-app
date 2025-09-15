import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router";
import ChartContainer from "../../components/charts/ChartContainer";
import NavigationBar from "../../components/NavigationBar";

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
        <ChartContainer data={chartData} />
      </div>
    </div>
  );
}

export default Pairs;
