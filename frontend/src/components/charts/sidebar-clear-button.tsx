import React, { useContext } from "react";
import { ChartContext } from "./context";

const SidebarClearButton: React.FC = () => {
  const chartContext = useContext(ChartContext);
  const clearDrawings = chartContext?.clearDrawings;

  return (
    <div className="mb-2">
      <button
        className="w-8 h-8 border border-gray-300 rounded bg-white cursor-pointer flex items-center justify-center text-base mx-0.5"
        title="Clear All Series"
        onClick={clearDrawings}
      >
        🗑️
      </button>
    </div>
  );
};

export default SidebarClearButton;
