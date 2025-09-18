import React, { useState, ReactNode } from "react";
import type { Marker } from "./chartTypes";
import { ChartContext } from "./chartContext";

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

  return (
    <ChartContext.Provider value={{ markers, addMarker, clearMarkers }}>
      {children}
    </ChartContext.Provider>
  );
};
