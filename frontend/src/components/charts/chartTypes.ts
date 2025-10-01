import type { BaseChartRef } from "./BaseChart";

export interface Series {
  id: string;
  points: { id: string; x: number; y: number }[];
}

export interface Drawing {
  id: string;
  name: string;
  type: 'dot' | 'line' | 'trendline' | 'fibonacci' | 'channel' | 'rectangle';
  color: string;
  series: Series[];
  metadata?: Record<string, any>;
}

export interface ChartContextType {
  drawings: Drawing[];
  addDrawing: (drawing: Drawing) => void;
  clearDrawings: () => void;
  updatePoint: (drawingId: string, seriesId: string, pointId: string, x: number, y: number) => void;
  selectedData: { drawingId: string; seriesId: string; pointId: string } | null;
  setSelectedData: (point: { drawingId: string; seriesId: string; pointId: string } | null) => void;
  findPoints: (x: number, y: number, xTolerance?: number, yTolerance?: number) => { drawingId: string; seriesId: string; pointId: string } | null;
  chartRef: React.RefObject<BaseChartRef | null>;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  resetZoom: () => void;
  toggleCrosshair: () => void;
  toggleDotMode: () => void;
  selectedDrawing: string | null;
  selectDrawing: (drawingId: string | null) => void;
  updateDrawingName: (drawingId: string, name: string) => void;
  updateDrawingColor: (drawingId: string, color: string) => void;
  deleteDrawing: (drawingId: string) => void;
  addPointToDrawing: (drawingId: string, seriesId: string, point: { x: number; y: number }) => void;
  removePoint: (drawingId: string, seriesId: string, pointId: string) => void;
  toggleLineMode: () => void;
  getIncompleteDrawing: () => Drawing | undefined;
  completeDrawing: (drawingId: string) => void;
  getRemainingPoints: () => number;
}
