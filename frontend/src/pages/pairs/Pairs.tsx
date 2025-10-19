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
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  
  // Get chart context for drawings
  const { drawings, addDrawing } = useChart();
  
  // Auto-save drawings to backend
  const { savedCount } = useDrawingsPersistence({
    pair: currentPair,
    drawings,
    enabled: true,
  });

  // Load saved drawings on mount
  useEffect(() => {
    const loadDrawings = async () => {
      try {
        const response = await apiClient.getDrawings(currentPair);
        
        // Add each drawing to the chart
        response.drawings.forEach((drawing) => {
          addDrawing(drawing as any); // Cast needed due to slight type differences
        });
      } catch (err) {
        console.error("Error loading drawings:", err);
      }
    };

    loadDrawings();
  }, [currentPair, addDrawing]);

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getCandles(currentPair, {
          limit: 500, // Load first 500 candles initially
        });

        setData(response.results);
        setNextUrl(response.next);
        setPrevUrl(response.previous);
        setTotalCount(response.count);
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

  // Load more data (for pagination)
  const loadMoreData = useCallback(async (direction: 'next' | 'prev') => {
    const url = direction === 'next' ? nextUrl : prevUrl;
    if (!url || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const response = await apiClient.fetchFromURL(url);
      
      if (direction === 'next') {
        // Append new data
        setData(prev => [...prev, ...response.results]);
      } else {
        // Prepend old data
        setData(prev => [...response.results, ...prev]);
      }
      
      setNextUrl(response.next);
      setPrevUrl(response.previous);
    } catch (err) {
      console.error("Error loading more data:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextUrl, prevUrl, isLoadingMore]);

  // Auto-fetch when reaching the start of the chart
  const handleReachStart = useCallback(async () => {
    
    if (!prevUrl) {
      return;
    }
    if (isAutoFetching) {
      return;
    }
    if (isLoadingMore) {
      return;
    }

    try {
      setIsAutoFetching(true);
      const response = await apiClient.fetchFromURL(prevUrl);
      
      
      // Prepend old data
      setData(prev => {
        const newData = [...response.results, ...prev];
        return newData;
      });
      setPrevUrl(response.previous);
    } catch (err) {
      console.error("❌ Error auto-fetching data:", err);
    } finally {
      setIsAutoFetching(false);
    }
  }, [prevUrl, isAutoFetching, isLoadingMore]);

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
      
      {/* Pagination Info */}
      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b">
        <div className="text-sm text-gray-600 flex items-center gap-4">
          <span>
            Loaded {data.length.toLocaleString()} of {totalCount.toLocaleString()} candles
            {isLoadingMore && <span className="ml-2 text-blue-600">Loading...</span>}
            {isAutoFetching && <span className="ml-2 text-green-600">Auto-fetching...</span>}
          </span>
          <span className="text-gray-400">|</span>
          <span className="flex items-center gap-1">
            <span className={drawings.length > 0 ? "text-green-600" : "text-gray-500"}>
              {drawings.length} drawing{drawings.length !== 1 ? 's' : ''}
            </span>
            {savedCount > 0 && (
              <span className="text-xs text-gray-500">
                ({savedCount} saved)
              </span>
            )}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadMoreData('prev')}
            disabled={!prevUrl || isLoadingMore}
            className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Load Older
          </button>
          <button
            onClick={() => loadMoreData('next')}
            disabled={!nextUrl || isLoadingMore}
            className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Load Newer →
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Chart data={chartData} onReachStart={handleReachStart} />
      </div>
    </div>
  );
}

export default Pairs;
