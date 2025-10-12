import React, { useContext } from "react";
import { ChartContext } from "./chart-context";

const SidebarLineButton: React.FC = () => {
  const chartContext = useContext(ChartContext);
  const activeTool = chartContext?.activeTool || "none";
  const toggleLineMode = chartContext?.toggleLineMode;
  const drawings = chartContext?.drawings || [];

  const getButtonContent = () => {
    if (activeTool !== "line") {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="3" y1="13" x2="13" y2="3"/>
          <circle cx="3" cy="13" r="1.5"/>
          <circle cx="13" cy="3" r="1.5"/>
        </svg>
      );
    }
    const incompleteDrawing = drawings.find((d) => d.metadata?.isIncomplete && d.type === activeTool);
    if (!incompleteDrawing) {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="3" y1="13" x2="13" y2="3"/>
          <circle cx="3" cy="13" r="1.5"/>
          <circle cx="13" cy="3" r="1.5"/>
        </svg>
      );
    }
    const currentPoints = incompleteDrawing.series[0]?.points.length || 0;
    const maxPoints = incompleteDrawing.metadata?.maxPoints || 2;
    return maxPoints - currentPoints;
  };

  const isActive = activeTool === "line";

  return (
    <button
      className={`h-8 w-8 flex items-center justify-center ${isActive ? "bg-gray-400" : "bg-white"}`}
      title="Line Drawing Tool"
      onClick={toggleLineMode}
    >
      {getButtonContent()}
    </button>
  );
};

export default SidebarLineButton;
