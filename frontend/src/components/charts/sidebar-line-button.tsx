import React, { useContext } from "react";
import { ChartContext } from "./context";

const SidebarLineButton: React.FC = () => {
  const chartContext = useContext(ChartContext);
  const activeTool = chartContext?.activeTool || "none";
  const toggleLineMode = chartContext?.toggleLineMode;
  const drawings = chartContext?.drawings || [];

  const getButtonContent = () => {
    if (activeTool !== "line") return "📏";
    const incompleteDrawing = drawings.find((d) => d.metadata?.isIncomplete && d.type === activeTool);
    if (!incompleteDrawing) return "📏";
    const currentPoints = incompleteDrawing.series[0]?.points.length || 0;
    const maxPoints = incompleteDrawing.metadata?.maxPoints || 2;
    return maxPoints - currentPoints;
  };

  return (
    <div className="mb-2">
      <button
        className={`w-8 h-8 border border-gray-300 rounded cursor-pointer flex items-center justify-center text-base mx-0.5 ${
          activeTool === "line" ? "bg-green-500 text-white" : "bg-white text-black"
        }`}
        title="Line Drawing Tool"
        onClick={toggleLineMode}
      >
        {getButtonContent()}
      </button>
    </div>
  );
};

export default SidebarLineButton;
