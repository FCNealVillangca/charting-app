import { createContext, useRef, useCallback } from "react";
import React, { useState } from "react";
import type { ReactNode } from "react";
import type { ChartContextType, Drawing } from "./chartTypes";
import type { BaseChartRef } from "./BaseChart";

export const ChartContext = createContext<ChartContextType | undefined>(undefined);

export const ChartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedData, setSelectedData] = useState<{ drawingId: string; seriesId: string; pointId: string } | null>(null);
  const [activeTool, setActiveTool] = useState<string>("none");
  const chartRef = useRef<BaseChartRef>(null);

  const addDrawing = useCallback((newDrawing: Drawing) => {
    setDrawings((prev) => [...prev, newDrawing]);
  }, []);

  const clearDrawings = useCallback(() => {
    setDrawings([]);
    setSelectedData(null);
  }, []);

  const updatePoint = useCallback((drawingId: string, seriesId: string, pointId: string, x: number, y: number) => {
    setDrawings((prev) =>
      prev.map((d) =>
        d.id === drawingId
          ? {
              ...d,
              series: d.series.map((s) =>
                s.id === seriesId
                  ? {
                      ...s,
                      points: s.points.map((p) =>
                        p.id === pointId ? { ...p, x, y } : p
                      ),
                    }
                  : s
              ),
            }
          : d
      )
    );
  }, []);

  const findPoints = useCallback((x: number, y: number, xTolerance: number = 10, yTolerance: number = 10): { drawingId: string; seriesId: string; pointId: string } | null => {
    for (const d of drawings) {
      for (const s of d.series) {
        const point = s.points.find((p) => Math.abs(p.x - x) < xTolerance && Math.abs(p.y - y) < yTolerance);
        if (point) {
          return { drawingId: d.id, seriesId: s.id, pointId: point.id };
        }
      }
    }
    return null;
  }, [drawings]);

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

  const toggleLineMode = () => {
    setActiveTool(activeTool === "none" ? "line" : "none");
  };

  const getIncompleteDrawing = useCallback(() => {
    return drawings.find((d) => d.metadata?.isIncomplete && d.type === activeTool);
  }, [drawings, activeTool]);

  const completeDrawing = useCallback((drawingId: string) => {
    setDrawings((prev) =>
      prev.map((d) =>
        d.id === drawingId
          ? { ...d, metadata: { ...d.metadata, isIncomplete: false } }
          : d
      )
    );
    setActiveTool("none"); // Auto-deselect tool when complete
  }, []);

  const deleteDrawing = useCallback((drawingId: string) => {
    setDrawings((prev) => prev.filter((d) => d.id !== drawingId));
    setSelectedData(null);
  }, []);

  const addPointToDrawing = useCallback((drawingId: string, seriesId: string, point: { x: number; y: number }) => {
    const pointId = `point_${Date.now()}_${Math.random()}`;
    setDrawings((prev) =>
      prev.map((d) =>
        d.id === drawingId
          ? {
              ...d,
              series: d.series.map((s) =>
                s.id === seriesId
                  ? { ...s, points: [...s.points, { id: pointId, ...point }] }
                  : s
              ),
            }
          : d
      )
    );
  }, []);

  const removePoint = useCallback((drawingId: string, seriesId: string, pointId: string) => {
    setDrawings((prev) =>
      prev.map((d) =>
        d.id === drawingId
          ? {
              ...d,
              series: d.series.map((s) =>
                s.id === seriesId
                  ? { ...s, points: s.points.filter((p) => p.id !== pointId) }
                  : s
              ),
            }
          : d
      )
    );
  }, []);

  return React.createElement(
    ChartContext.Provider,
    {
      value: {
        drawings,
        addDrawing,
        clearDrawings,
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
        deleteDrawing,
        addPointToDrawing,
        removePoint,
        toggleLineMode,
        getIncompleteDrawing,
        completeDrawing
      }
    },
    children
  );
};
