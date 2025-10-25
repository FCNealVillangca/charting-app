import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router";
import ChartNavbar from "../../components/charts/chart-navbar";
import Chart from "../../components/charts/chart";
import { apiClient, type CandleData } from "../../lib/api-client";
import type { DataPoint } from "../../components/charts/chart-types";
import { useChart } from "../../components/charts/chart-hook";
import { useDrawingsPersistence } from "../../hooks/useDrawingsPersistence";

function Pairs() {
  const { pair } = useParams<{ pair: string }>();
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPair, setCurrentPair] = useState(pair || "EURUSD");
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  
  // Get chart context for drawings
  const { drawings, addDrawing, replaceDrawing, setIsLoading } = useChart();
  
  // Auto-save drawings to backend (also handles loading on mount)
  useDrawingsPersistence({
    pair: currentPair,
    drawings,
    enabled: true,
    addDrawing,
    replaceDrawing,
    setIsLoading,
  });

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getCandles(currentPair, {
          limit: 500, // Load first 500 candles initially
        });

        setData(response.results);
        setPrevUrl(response.previous);
        setError(null);
      } catch (err) {
        console.error("Error fetching candle data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [currentPair]);

  // Auto-fetch when reaching the start of the chart
  const handleReachStart = useCallback(async () => {
    if (!prevUrl || isAutoFetching) {
      return;
    }

    try {
      setIsAutoFetching(true);
      const response = await apiClient.fetchFromURL(prevUrl);
      
      // Prepend old data
      setData(prev => [...response.results, ...prev]);
      setPrevUrl(response.previous);
    } catch (err) {
      console.error("Error auto-fetching data:", err);
    } finally {
      setIsAutoFetching(false);
    }
  }, [prevUrl, isAutoFetching]);

  // Memoize chart data transformation to prevent unnecessary re-renders
  const chartData = useMemo((): DataPoint[] => {
    const result = data.map((d) => ({
      time: d.time, // Already Unix timestamp in seconds from API
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    return result;
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="text-center">
          <div className="text-lg font-medium">Loading chart data...</div>
          <div className="text-sm text-gray-500 mt-2">Fetching candles from API</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600">Error: {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handlePairChange = (newPair: string) => {
    setCurrentPair(newPair);
    // In a real app, this would navigate to the new pair route
    // For now, we'll just update the state
  };

  return (
    <div className="flex flex-col h-screen w-full">
      <ChartNavbar
        currentPair={currentPair}
        onPairChange={handlePairChange}
      />
      
      <div className="flex-1 overflow-hidden">
        <Chart data={chartData} onReachStart={handleReachStart} />
      </div>
    </div>
  );
}

export default Pairs;
