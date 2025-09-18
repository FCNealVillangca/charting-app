export interface Marker {
  id: string;
  x: number;
  y: number;
}

export interface ChartContextType {
  markers: Marker[];
  addMarker: (marker: Marker) => void;
  clearMarkers: () => void;
}
