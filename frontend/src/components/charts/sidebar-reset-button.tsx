import React, { useContext } from "react";
import { ChartContext } from "./context";

const SidebarResetButton: React.FC = () => {
  const chartContext = useContext(ChartContext);
  const resetZoom = chartContext?.resetZoom;

  return (
    <button 
      className="w-8 h-8 bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer flex items-center justify-center text-base font-bold text-gray-800 hover:shadow-md hover:border-gray-400 transition-all duration-200"
      title="Reset Zoom" 
      onClick={resetZoom}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 8a5 5 0 0 1 5-5h5"/>
        <path d="M13 8a5 5 0 0 1-5 5H3"/>
        <path d="M8 3v5l3-3"/>
      </svg>
    </button>
  );
};

export default SidebarResetButton;
