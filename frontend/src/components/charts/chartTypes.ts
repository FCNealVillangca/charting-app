import type { BaseChartRef } from "./BaseChart";

export interface Series {
  id: string;
  name: string;
  color: string;
  points: { id: string; x: number; y: number }[];
}

export interface ChartContextType {
  series: Series[];
  addSeries: (series: Series) => void;
  clearSeries: () => void;
  updatePoint: (seriesId: string, pointId: string, x: number, y: number) => void;
  selectedData: { seriesId: string; pointId: string } | null;
  setSelectedData: (point: { seriesId: string; pointId: string } | null) => void;
  findPoints: (x: number, y: number, xTolerance?: number, yTolerance?: number) => { seriesId: string; pointId: string } | null;
  chartRef: React.RefObject<BaseChartRef | null>;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  resetZoom: () => void;
  toggleCrosshair: () => void;
  toggleDotMode: () => void;
  selectedSeries: string | null;
  selectSeries: (seriesId: string | null) => void;
  updateSeriesName: (seriesId: string, name: string) => void;
  updateSeriesColor: (seriesId: string, color: string) => void;
  deleteSeries: (seriesId: string) => void;
  addPointToSeries: (seriesId: string, point: { x: number; y: number }) => void;
  removePoint: (seriesId: string, pointId: string) => void;
}
