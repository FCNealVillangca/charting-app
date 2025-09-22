import { createContext, useRef, useCallback } from "react";
import React, { useState } from "react";
import type { ReactNode } from "react";
import type { ChartContextType } from "./chartTypes";
import type { Series } from "./chartTypes";
import type { BaseChartRef } from "./BaseChart";
import { getRandomChartColor } from "./colorUtils";

export const ChartContext = createContext<ChartContextType | undefined>(undefined);

export const ChartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [series, setSeries] = useState<Series[]>([]);
  const [selectedData, setSelectedData] = useState<{ seriesId: string; pointId: string } | null>(null);
  const [activeTool, setActiveTool] = useState<string>("none");
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const chartRef = useRef<BaseChartRef>(null);

  const addSeries = useCallback((newSeries: Series) => {
    setSeries((prev) => [...prev, newSeries]);
  }, []);

  const clearSeries = useCallback(() => {
    setSeries([]);
    setSelectedData(null);
  }, []);

  const updatePoint = useCallback((seriesId: string, pointId: string, x: number, y: number) => {
    setSeries((prev) =>
      prev.map((s) =>
        s.id === seriesId
          ? {
              ...s,
              points: s.points.map((p) =>
                p.id === pointId ? { ...p, x, y } : p
              ),
            }
          : s
      )
    );
  }, []);

  const findPoints = useCallback((x: number, y: number, xTolerance: number = 10, yTolerance: number = 10): { seriesId: string; pointId: string } | null => {
    for (const s of series) {
      const point = s.points.find((p) => Math.abs(p.x - x) < xTolerance && Math.abs(p.y - y) < yTolerance);
      if (point) {
        return { seriesId: s.id, pointId: point.id };
      }
    }
    return null;
  }, [series]);

  const resetZoom = () => {
    console.log("Reset zoom clicked");
    chartRef.current?.resetZoom();
  };

  const toggleCrosshair = () => {
    // Simple crosshair toggle - just show an alert for now
    alert("Crosshair functionality coming soon!");
  };

  const toggleDotMode = () => {
    setActiveTool(activeTool === "none" ? "dot" : "none");
  };

  const selectSeries = useCallback((seriesId: string | null) => {
    setSelectedSeries(seriesId);
  }, []);

  const updateSeriesName = useCallback((seriesId: string, name: string) => {
    setSeries((prev) =>
      prev.map((s) => (s.id === seriesId ? { ...s, name } : s))
    );
  }, []);

  const updateSeriesColor = useCallback((seriesId: string, color: string) => {
    setSeries((prev) =>
      prev.map((s) => (s.id === seriesId ? { ...s, color } : s))
    );
  }, []);

  const deleteSeries = useCallback((seriesId: string) => {
    setSeries((prev) => prev.filter((s) => s.id !== seriesId));
    if (selectedSeries === seriesId) {
      setSelectedSeries(null);
    }
    setSelectedData(null);
  }, [selectedSeries]);

  const addPointToSeries = useCallback((seriesId: string, point: { x: number; y: number }) => {
    const pointId = `point_${Date.now()}_${Math.random()}`;
    setSeries((prev) =>
      prev.map((s) =>
        s.id === seriesId
          ? { ...s, points: [...s.points, { id: pointId, ...point }] }
          : s
      )
    );
  }, []);

  const removePoint = useCallback((seriesId: string, pointId: string) => {
    setSeries((prev) =>
      prev.map((s) =>
        s.id === seriesId
          ? { ...s, points: s.points.filter((p) => p.id !== pointId) }
          : s
      )
    );
  }, []);

  return React.createElement(
    ChartContext.Provider,
    {
      value: {
        series,
        addSeries,
        clearSeries,
        updatePoint,
        selectedData,
        setSelectedData,
        findPoints,
        chartRef,
        activeTool,
        setActiveTool,
        resetZoom,
        toggleCrosshair,
        toggleDotMode,
        selectedSeries,
        selectSeries,
        updateSeriesName,
        updateSeriesColor,
        deleteSeries,
        addPointToSeries,
        removePoint
      }
    },
    children
  );
};
