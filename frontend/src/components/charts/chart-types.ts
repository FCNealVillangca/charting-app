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
  id: number | null;
  name?: string | null;
  style?: Record<string, any>;
  points: { id: number | null; x: number; y: number }[];
}

export interface Drawing {
  id: number | null;
  name: string;
  type: 'dot' | 'triangle' | 'square' | 'circle' | 'diamond' | 'line' | 'trendline' | 'fibonacci' | 'channel' | 'rectangle' | 'hline';
  style: {
    color: string;
    seriesColors?: Record<string, string>; // Add this line
  };
  series: Series[];
  isIncomplete?: boolean;
}

export interface ChartContextType {
  drawings: Drawing[];
  addDrawing: (drawing: Drawing) => void;
  clearDrawings: () => void;
  updatePoint: (drawingId: number | null, seriesId: number | null, pointId: number | null, x: number, y: number) => void;
  updateDrawing: (drawingId: number | null, updates: Partial<Drawing>) => void;
  replaceDrawing: (oldDrawing: Drawing, newDrawing: Drawing) => void;
  selectedData: { drawingId: number | null; seriesId: number | null; pointId: number | null } | null;
  setSelectedData: (point: { drawingId: number | null; seriesId: number | null; pointId: number | null } | null) => void;
  selectedDrawingId: number | null;
  setSelectedDrawingId: (drawingId: number | null) => void;
  findPoints: (x: number, y: number, xTolerance?: number, yTolerance?: number) => { drawingId: number | null; seriesId: number | null; pointId: number | null } | null;
  chartRef: React.RefObject<BaseChartRef | null>;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  resetZoom: () => void;
  toggleCrosshair: () => void;
  toggleDotMode: () => void;
  deleteDrawing: (drawingId: number | null) => void;
  addPointToDrawing: (drawingId: number | null, seriesId: number | null, point: { x: number; y: number }) => void;
  removePoint: (drawingId: number | null, seriesId: number | null, pointId: number | null) => void;
  toggleLineMode: () => void;
  toggleChannelMode: () => void;
  toggleHLineMode: () => void;
  getIncompleteDrawing: () => Drawing | undefined;
  completeDrawing: (drawingId: number | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

