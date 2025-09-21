import { createContext, useRef } from "react";
import React, { useState } from "react";
import type { ReactNode } from "react";
import type { ChartContextType } from "./chartTypes";
import type { Series } from "./chartTypes";
import type { BaseChartRef } from "./BaseChart";

export const ChartContext = createContext<ChartContextType | undefined>(undefined);

export const ChartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [series, setSeries] = useState<Series[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<{ seriesId: string; pointId: string } | null>(null);
  const [activeTool, setActiveTool] = useState<string>("none");
  const chartRef = useRef<BaseChartRef>(null);

  const addSeries = (series: Series) => {
    setSeries((prev) => [...prev, series]);
  };

  const clearSeries = () => {
    setSeries([]);
    setSelectedPoint(null);
  };

  const updatePoint = (seriesId: string, pointId: string, x: number, y: number) => {
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
  };

  const findPoints = (x: number, y: number) => {
    for (const s of series) {
      const point = s.points.find((p) => Math.abs(p.x - x) < 2 && Math.abs(p.y - y) < 0.1);
      if (point) {
        console.log(s, point);
        setSelectedPoint({ seriesId: s.id, pointId: point.id });
        return;
      }
    }
    // Don't clear selectedPoint if no point found
  };

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

  return React.createElement(
    ChartContext.Provider,
    { 
      value: {
        series,
        addSeries,
        clearSeries,
        updatePoint,
        selectedPoint,
        setSelectedPoint,
        findPoints,
        chartRef,
        activeTool,
        setActiveTool,
        resetZoom,
        toggleCrosshair,
        toggleDotMode
      }
    },
    children
  );
};
