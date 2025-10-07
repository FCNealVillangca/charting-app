export interface DataPoint {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

// BaseChartRef interface will be moved here from BaseChart.tsx
export interface BaseChartRef {
  resetZoom: () => void;
  getChart: () => Highcharts.Chart | null;
  clearSeries: () => void;
}

export interface Series {
  id: string;
  points: { id: string; x: number; y: number }[];
}

export interface Drawing {
  id: string;
  name: string;
  type: 'dot' | 'triangle' | 'square' | 'circle' | 'diamond' | 'line' | 'trendline' | 'fibonacci' | 'channel' | 'rectangle';
  color: string;
  series: Series[];
  metadata?: Record<string, any>;
}

export interface ChartContextType {
  drawings: Drawing[];
  addDrawing: (drawing: Drawing) => void;
  clearDrawings: () => void;
  updatePoint: (drawingId: string, seriesId: string, pointId: string, x: number, y: number) => void;
  updateDrawing: (drawingId: string, updates: Partial<Drawing>) => void;
  selectedData: { drawingId: string; seriesId: string; pointId: string } | null;
  setSelectedData: (point: { drawingId: string; seriesId: string; pointId: string } | null) => void;
  selectedDrawingId: string | null;
  setSelectedDrawingId: (drawingId: string | null) => void;
  findPoints: (x: number, y: number, xTolerance?: number, yTolerance?: number) => { drawingId: string; seriesId: string; pointId: string } | null;
  chartRef: React.RefObject<BaseChartRef | null>;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  resetZoom: () => void;
  toggleCrosshair: () => void;
  toggleDotMode: () => void;
  deleteDrawing: (drawingId: string) => void;
  addPointToDrawing: (drawingId: string, seriesId: string, point: { x: number; y: number }) => void;
  removePoint: (drawingId: string, seriesId: string, pointId: string) => void;
  toggleLineMode: () => void;
  getIncompleteDrawing: () => Drawing | undefined;
  completeDrawing: (drawingId: string) => void;
}