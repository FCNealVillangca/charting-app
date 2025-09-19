import type { BaseChartRef } from "./BaseChart";

export interface Marker {
  id: string;
  x: number;
  y: number;
}

export interface ChartContextType {
  markers: Marker[];
  addMarker: (marker: Marker) => void;
  clearMarkers: () => void;
  chartRef: React.RefObject<BaseChartRef | null>;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  resetZoom: () => void;
  toggleCrosshair: () => void;
  toggleDotMode: () => void;
}
