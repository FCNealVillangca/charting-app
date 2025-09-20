import type { BaseChartRef } from "./BaseChart";

export interface Series {
  id: string;
  points: { x: number; y: number }[];
}

export interface ChartContextType {
  series: Series[];
  addSeries: (series: Series) => void;
  clearSeries: () => void;
  selectedSeries: string | null;
  setSelectedSeries: (id: string | null) => void;
  findPoints: (x: number, y: number) => void;
  chartRef: React.RefObject<BaseChartRef | null>;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  resetZoom: () => void;
  toggleCrosshair: () => void;
  toggleDotMode: () => void;
}
