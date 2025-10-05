import React, { useContext, useState } from "react";
import { ChartContext } from "./context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const SidebarScatterButton: React.FC = () => {
  const chartContext = useContext(ChartContext);
  const activeTool = chartContext?.activeTool || "none";
  const toggleDotMode = chartContext?.toggleDotMode;
  const [selectedShape, setSelectedShape] = useState<string>("dot");

  const getShapeIcon = (shape: string) => {
    switch (shape) {
      case "dot":
        return "•";
      case "triangle":
        return "▲";
      case "square":
        return "■";
      case "circle":
        return "●";
      case "diamond":
        return "◆";
      default:
        return "•";
    }
  };

  const handleMainButtonClick = () => {
    // Always activate dot mode with the currently selected shape
    if (activeTool !== selectedShape) {
      chartContext?.setActiveTool(selectedShape);
    }
  };

  const handleShapeSelect = (shape: string) => {
    console.log("Selecting shape:", shape);
    setSelectedShape(shape);
    // Activate the selected shape mode
    chartContext?.setActiveTool(shape);
  };

  return (
    <div className="mb-2 flex flex-row">
      <button
        className={`w-8 h-8 border border-gray-300 rounded cursor-pointer flex items-center justify-center text-base mx-0.5 ${
          activeTool === selectedShape ? "bg-green-500 text-white" : "bg-white text-black"
        }`}
        title="Toggle Dot Placement"
        onClick={handleMainButtonClick}
      >
        {getShapeIcon(selectedShape)}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-6 h-8 border-l border-gray-300 rounded-r bg-white cursor-pointer flex items-center justify-center text-sm">
            ›
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleShapeSelect("dot")}>
            <span className="mr-2">•</span> Dot
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeSelect("triangle")}>
            <span className="mr-2">▲</span> Triangle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeSelect("square")}>
            <span className="mr-2">■</span> Square
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeSelect("circle")}>
            <span className="mr-2">●</span> Circle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeSelect("diamond")}>
            <span className="mr-2">◆</span> Diamond
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SidebarScatterButton;
