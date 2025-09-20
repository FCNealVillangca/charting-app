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
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>("none");
  const chartRef = useRef<BaseChartRef>(null);

  const addSeries = (series: Series) => {
    setSeries((prev) => [...prev, series]);
  };

  const clearSeries = () => {
    setSeries([]);
    setSelectedSeries(null);
  };

  const findPoints = (x: number, y: number) => {
    const found = series.find((s) =>
      s.points.some((p) => Math.abs(p.x - x) < 0.01 && Math.abs(p.y - y) < 0.01)
    );
    if (found) {
      console.log(found);
      setSelectedSeries(found.id);
    } else {
      setSelectedSeries(null);
    }
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
        selectedSeries,
        setSelectedSeries,
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
