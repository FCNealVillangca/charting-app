import { createContext, useRef, useCallback } from "react";
import React, { useState } from "react";
import type { ReactNode } from "react";
import type { ChartContextType, Drawing, BaseChartRef } from "./chart-types";
import {
  updatePointInDrawings,
  findLineOrPoint,
  addPointToDrawing,
  removePointFromDrawing,
  deleteDrawingById,
  completeDrawingById,
  getIncompleteDrawing,
  recalculateChannelCenterLine,
} from "./chart-utils";

export const ChartContext = createContext<ChartContextType | undefined>(undefined);

export const ChartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedData, setSelectedData] = useState<{ drawingId: number | null; seriesId: number | null; pointId: number | null } | null>(null);
  const [selectedDrawingId, setSelectedDrawingId] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<string>("none");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chartRef = useRef<BaseChartRef>(null);

  const addDrawing = useCallback((newDrawing: Drawing) => {
    setDrawings((prev) => [...prev, newDrawing]);
  }, []);

  const clearDrawings = useCallback(() => {
    setDrawings([]);
    setSelectedData(null);
    setSelectedDrawingId(null);
  }, []);

  const updatePoint = useCallback((drawingId: number | null, seriesId: number | null, pointId: number | null, x: number, y: number) => {
    setDrawings((prev) => {
      // Find the drawing being updated
      const drawing = prev.find(d => d.id === drawingId);
      
      // Check if this is a channel and if we're dragging the center point
      if (drawing && drawing.type === 'channel' && drawing.metadata?.centerSeriesId === seriesId) {
        // Moving the center point - move all boundary points by the same delta
        const centerSeries = drawing.series.find(s => s.id === seriesId);
        const centerPoint = centerSeries?.points.find(p => p.id === pointId);
        
        if (centerPoint) {
          const deltaY = y - centerPoint.y; // Only move vertically
          
          // Update all points in all series by deltaY
          const updated = prev.map(d => {
            if (d.id === drawingId) {
              return {
                ...d,
                series: d.series.map(s => ({
                  ...s,
                  points: s.points.map(p => ({
                    ...p,
                    y: p.y + deltaY
                  }))
                }))
              };
            }
            return d;
          });
          
          // No need to recalculate since everything moved together
          return updated;
        }
      }
      
      // Normal point update
      const updated = updatePointInDrawings(prev, drawingId, seriesId, pointId, x, y);
      
      // If this is a channel and we're updating a boundary line (not dashed or center), recalculate dashed line and center
      if (drawing && drawing.type === 'channel' && 
          seriesId !== drawing.metadata?.centerSeriesId && 
          seriesId !== drawing.metadata?.dashedSeriesId) {
        return updated.map(d => {
          if (d.id === drawingId) {
            return recalculateChannelCenterLine(d);
          }
          return d;
        });
      }
      
      return updated;
    });
  }, []);

  const findPoints = useCallback((x: number, y: number, xTolerance: number = 10, yTolerance: number = 10): { drawingId: number | null; seriesId: number | null; pointId: number | null } | null => {
    return findLineOrPoint(drawings, x, y, xTolerance, yTolerance);
  }, [drawings]);

  const resetZoom = useCallback(() => {
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

  const toggleChannelMode = useCallback(() => {
    if (activeTool === "channel") {
      // When turning off channel mode, remove any incomplete channel drawings
      setDrawings((prev) => prev.filter((d) => !(d.type === "channel" && d.metadata?.isIncomplete)));
      setActiveTool("none");
    } else {
      setActiveTool("channel");
    }
  }, [activeTool]);

  const toggleHLineMode = useCallback(() => {
    setActiveTool(activeTool === "hline" ? "none" : "hline");
  }, [activeTool]);

  const getIncompleteDrawingCallback = useCallback(() => {
    return getIncompleteDrawing(drawings, activeTool);
  }, [drawings, activeTool]);

  const completeDrawing = useCallback((drawingId: number | null) => {
    setDrawings((prev) => completeDrawingById(prev, drawingId));
    setActiveTool("none"); // Auto-deselect tool when complete
  }, []);

  const deleteDrawing = useCallback((drawingId: number | null) => {
    setDrawings((prev) => deleteDrawingById(prev, drawingId));
    setSelectedData(null);
    setSelectedDrawingId(null);
  }, []);

  const addPointToDrawingCallback = useCallback((drawingId: number | null, seriesId: number | null, point: { x: number; y: number }) => {
    setDrawings((prev) => addPointToDrawing(prev, drawingId, seriesId, point));
  }, []);

  const removePoint = useCallback((drawingId: number | null, seriesId: number | null, pointId: number | null) => {
    setDrawings((prev) => removePointFromDrawing(prev, drawingId, seriesId, pointId));
  }, []);

  const updateDrawing = useCallback((drawingId: number | null, updates: Partial<Drawing>) => {
    setDrawings((prev) => prev.map((drawing) => 
      drawing.id === drawingId ? { ...drawing, ...updates } : drawing
    ));
  }, []);

  const replaceDrawing = useCallback((oldDrawing: Drawing, newDrawing: Drawing) => {
    setDrawings((prev) => {
      // Find the exact drawing by object reference
      const index = prev.indexOf(oldDrawing);
      if (index === -1) return prev; // Not found, return unchanged
      
      // Replace only that specific drawing
      const updated = [...prev];
      updated[index] = newDrawing;
      return updated;
    });
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
        replaceDrawing,
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
        toggleChannelMode,
        toggleHLineMode,
        getIncompleteDrawing: getIncompleteDrawingCallback,
        completeDrawing,
        isLoading,
        setIsLoading
      }
    },
    children
  );
};

