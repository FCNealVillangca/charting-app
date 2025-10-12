import React, { useContext } from "react";
import { ChartContext } from "./chart-context";

const SidebarChannelButton: React.FC = () => {
  const chartContext = useContext(ChartContext);
  const activeTool = chartContext?.activeTool || "none";
  const toggleChannelMode = chartContext?.toggleChannelMode;
  const drawings = chartContext?.drawings || [];

  const getButtonContent = () => {
    if (activeTool !== "channel") {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="2" y1="4" x2="14" y2="4"/>
          <line x1="2" y1="12" x2="14" y2="12"/>
          <circle cx="2" cy="4" r="1.5"/>
          <circle cx="14" cy="4" r="1.5"/>
          <circle cx="2" cy="12" r="1.5"/>
          <circle cx="14" cy="12" r="1.5"/>
        </svg>
      );
    }
    const incompleteDrawing = drawings.find((d) => d.metadata?.isIncomplete && d.type === activeTool);
    if (!incompleteDrawing) {
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="2" y1="4" x2="14" y2="4"/>
          <line x1="2" y1="12" x2="14" y2="12"/>
          <circle cx="2" cy="4" r="1.5"/>
          <circle cx="14" cy="4" r="1.5"/>
          <circle cx="2" cy="12" r="1.5"/>
          <circle cx="14" cy="12" r="1.5"/>
        </svg>
      );
    }
    const currentPoints = incompleteDrawing.series[0]?.points.length || 0;
    const maxPoints = incompleteDrawing.metadata?.maxPoints || 3;
    return maxPoints - currentPoints;
  };

  const isActive = activeTool === "channel";

  return (
    <button
      className={`h-8 w-8 flex items-center justify-center ${isActive ? "bg-gray-400" : "bg-white"}`}
      title="Trend Channel Tool"
      onClick={toggleChannelMode}
    >
      {getButtonContent()}
    </button>
  );
};

export default SidebarChannelButton;
