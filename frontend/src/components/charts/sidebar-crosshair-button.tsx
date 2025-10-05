import React, { useContext } from "react";
import { ChartContext } from "./context";

const SidebarCrosshairButton: React.FC = () => {
  const chartContext = useContext(ChartContext);
  const toggleCrosshair = chartContext?.toggleCrosshair;

  return (
    <div className="mb-2">
      <button
        className="w-8 h-8 border border-gray-300 rounded bg-white cursor-pointer flex items-center justify-center text-base mx-0.5"
        title="Crosshair"
        onClick={toggleCrosshair}
      >
        ✚
      </button>
    </div>
  );
};

export default SidebarCrosshairButton;
