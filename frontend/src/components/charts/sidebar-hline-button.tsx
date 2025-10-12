import React, { useContext } from "react";
import { ChartContext } from "./chart-context";

const SidebarHLineButton: React.FC = () => {
  const chartContext = useContext(ChartContext);
  const activeTool = chartContext?.activeTool || "none";
  const toggleHLineMode = chartContext?.toggleHLineMode;

  const isActive = activeTool === "hline";

  return (
    <button
      className={`h-8 w-8 flex items-center justify-center ${isActive ? "bg-gray-400" : "bg-white"}`}
      title="Horizontal Line Tool"
      onClick={toggleHLineMode}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="2" y1="8" x2="14" y2="8"/>
        <circle cx="8" cy="8" r="1.5"/>
      </svg>
    </button>
  );
};

export default SidebarHLineButton;

