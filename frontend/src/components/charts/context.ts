import { createContext, useRef, useCallback } from "react";
import React, { useState } from "react";
import type { ReactNode } from "react";
import type { ChartContextType, Drawing, BaseChartRef } from "./types";
import {
  updatePointInDrawings,
  findPointInDrawings,
  addPointToDrawing,
  removePointFromDrawing,
  deleteDrawingById,
  completeDrawingById,
  getIncompleteDrawing,
} from "./utils";

export const ChartContext = createContext<ChartContextType | undefined>(undefined);

export const ChartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedData, setSelectedData] = useState<{ drawingId: string; seriesId: string; pointId: string } | null>(null);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>("none");
  const chartRef = useRef<BaseChartRef>(null);

  const addDrawing = useCallback((newDrawing: Drawing) => {
    setDrawings((prev) => [...prev, newDrawing]);
  }, []);

  const clearDrawings = useCallback(() => {
    setDrawings([]);
    setSelectedData(null);
    setSelectedDrawingId(null);
  }, []);

  const updatePoint = useCallback((drawingId: string, seriesId: string, pointId: string, x: number, y: number) => {
    setDrawings((prev) => updatePointInDrawings(prev, drawingId, seriesId, pointId, x, y));
  }, []);

  const findPoints = useCallback((x: number, y: number, xTolerance: number = 10, yTolerance: number = 10): { drawingId: string; seriesId: string; pointId: string } | null => {
    return findPointInDrawings(drawings, x, y, xTolerance, yTolerance);
  }, [drawings]);

  const resetZoom = useCallback(() => {
    console.log("Reset zoom clicked");
    chartRef.current?.resetZoom();
  }, []);

  const toggleCrosshair = useCallback(() => {
    // Simple crosshair toggle - just show an alert for now
    alert("Crosshair functionality coming soon!");
  }, []);

  const toggleDotMode = useCallback(() => {
    setActiveTool(activeTool === "none" ? "dot" : "none");
  }, [activeTool]);

  const toggleLineMode = useCallback(() => {
    if (activeTool === "line") {
      // When turning off line mode, remove any incomplete line drawings
      setDrawings((prev) => prev.filter((d) => !(d.type === "line" && d.metadata?.isIncomplete)));
      setActiveTool("none");
    } else {
      setActiveTool("line");
    }
  }, [activeTool]);

  const getIncompleteDrawingCallback = useCallback(() => {
    return getIncompleteDrawing(drawings, activeTool);
  }, [drawings, activeTool]);

  const completeDrawing = useCallback((drawingId: string) => {
    setDrawings((prev) => completeDrawingById(prev, drawingId));
    setActiveTool("none"); // Auto-deselect tool when complete
  }, []);

  const deleteDrawing = useCallback((drawingId: string) => {
    setDrawings((prev) => deleteDrawingById(prev, drawingId));
    setSelectedData(null);
    setSelectedDrawingId(null);
  }, []);

  const addPointToDrawingCallback = useCallback((drawingId: string, seriesId: string, point: { x: number; y: number }) => {
    setDrawings((prev) => addPointToDrawing(prev, drawingId, seriesId, point));
  }, []);

  const removePoint = useCallback((drawingId: string, seriesId: string, pointId: string) => {
    setDrawings((prev) => removePointFromDrawing(prev, drawingId, seriesId, pointId));
  }, []);

  const updateDrawing = useCallback((drawingId: string, updates: Partial<Drawing>) => {
    setDrawings((prev) => prev.map((drawing) => 
      drawing.id === drawingId ? { ...drawing, ...updates } : drawing
    ));
  }, []);

  return React.createElement(
    ChartContext.Provider,
    {
      value: {
        drawings,
        addDrawing,
        clearDrawings,
        updatePoint,
        updateDrawing,
        selectedData,
        setSelectedData,
        selectedDrawingId,
        setSelectedDrawingId,
        findPoints,
        chartRef,
        activeTool,
        setActiveTool,
        resetZoom,
        toggleCrosshair,
        toggleDotMode,
        deleteDrawing,
        addPointToDrawing: addPointToDrawingCallback,
        removePoint,
        toggleLineMode,
        getIncompleteDrawing: getIncompleteDrawingCallback,
        completeDrawing
      }
    },
    children
  );
};
