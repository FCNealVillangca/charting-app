import React, { useContext } from "react";
import { ChartContext } from "./context";

const SidebarClearButton: React.FC = () => {
  const chartContext = useContext(ChartContext);
  const clearDrawings = chartContext?.clearDrawings;

  return (
    <button
      className="w-8 h-8 bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer flex items-center justify-center text-base font-bold text-gray-800 hover:shadow-md hover:border-gray-400 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
      title="Clear All Series"
      onClick={clearDrawings}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 6h10"/>
        <path d="M5 6v8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V6"/>
        <path d="M8 3v3"/>
        <path d="M6 3h4"/>
      </svg>
    </button>
  );
};

export default SidebarClearButton;
