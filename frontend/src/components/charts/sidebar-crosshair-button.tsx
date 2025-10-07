import React, { useContext } from "react";
import { ChartContext } from "./context";

const SidebarCrosshairButton: React.FC = () => {
  const chartContext = useContext(ChartContext);
  const toggleCrosshair = chartContext?.toggleCrosshair;

  return (
    <button
      className="w-8 h-8 bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer flex items-center justify-center text-base font-bold text-gray-800 hover:shadow-md hover:border-gray-400 transition-all duration-200"
      title="Crosshair"
      onClick={toggleCrosshair}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="8" y1="10" x2="8" y2="14"/>
        <line x1="2" y1="8" x2="6" y2="8"/>
        <line x1="10" y1="8" x2="14" y2="8"/>
      </svg>
    </button>
  );
};

export default SidebarCrosshairButton;
