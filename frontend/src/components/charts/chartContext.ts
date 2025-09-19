import { createContext, useRef } from "react";
import React, { useState } from "react";
import type { ReactNode } from "react";
import type { ChartContextType } from "./chartTypes";
import type { Marker } from "./chartTypes";
import type { BaseChartRef } from "./BaseChart";

export const ChartContext = createContext<ChartContextType | undefined>(undefined);

export const ChartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [activeTool, setActiveTool] = useState<string>("none");
  const chartRef = useRef<BaseChartRef>(null);

  const addMarker = (marker: Marker) => {
    setMarkers((prev) => [...prev, marker]);
  };

  const clearMarkers = () => {
    setMarkers([]);
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
        markers, 
        addMarker, 
        clearMarkers,
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
