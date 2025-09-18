import { createContext } from "react";
import React, { useState, ReactNode } from "react";
import type { ChartContextType } from "./chartTypes";
import type { Marker } from "./chartTypes";

export const ChartContext = createContext<ChartContextType | undefined>(undefined);

export const ChartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [markers, setMarkers] = useState<Marker[]>([]);

  const addMarker = (marker: Marker) => {
    setMarkers((prev) => [...prev, marker]);
  };

  const clearMarkers = () => {
    setMarkers([]);
  };

  return React.createElement(
    ChartContext.Provider,
    { value: { markers, addMarker, clearMarkers } },
    children
  );
};
