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
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="2"/>
          </svg>
        );
      case "triangle":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2 L14 12 L2 12 Z"/>
          </svg>
        );
      case "square":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="10" height="10"/>
          </svg>
        );
      case "circle":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="5"/>
          </svg>
        );
      case "diamond":
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2 L14 8 L8 14 L2 8 Z"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="2"/>
          </svg>
        );
    }
  };

  const handleMainButtonClick = () => {
    // Toggle the drawing mode for the selected shape
    if (activeTool === selectedShape) {
      chartContext?.setActiveTool("none");
    } else {
      chartContext?.setActiveTool(selectedShape);
    }
  };

  const handleShapeSelect = (shape: string) => {
    console.log("Selecting shape:", shape);
    setSelectedShape(shape);
    // Activate the selected shape mode
    chartContext?.setActiveTool(shape);
  };

  const isActive = activeTool === selectedShape;

  return (
    <div className="flex flex-row">
      <button
        className={`w-8 h-8 flex items-center justify-center
           ${
          isActive 
            ? "bg-green-500 border-green-500 text-white shadow-md" 
            : "bg-white border-gray-300 text-gray-800 hover:shadow-md hover:border-gray-400"
        }
        `}
        title="Toggle Dot Placement"
        onClick={handleMainButtonClick}
      >
        {getShapeIcon(selectedShape)}
      </button>
      {/* <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={`w-6 h-8 border border-l-0 rounded-r-lg shadow-sm cursor-pointer flex items-center justify-center text-xs font-bold transition-all duration-200 ${
            isActive 
              ? "bg-green-500 border-green-500 text-white" 
              : "bg-white border-gray-300 text-gray-800 hover:shadow-md hover:border-gray-400"
          }`}>
            ›
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleShapeSelect("dot")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-2">
              <circle cx="8" cy="8" r="2"/>
            </svg>
            Dot
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeSelect("triangle")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-2">
              <path d="M8 2 L14 12 L2 12 Z"/>
            </svg>
            Triangle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeSelect("square")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-2">
              <rect x="3" y="3" width="10" height="10"/>
            </svg>
            Square
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeSelect("circle")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-2">
              <circle cx="8" cy="8" r="5"/>
            </svg>
            Circle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShapeSelect("diamond")}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-2">
              <path d="M8 2 L14 8 L8 14 L2 8 Z"/>
            </svg>
            Diamond
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu> */}
    </div>
  );
};

export default SidebarScatterButton;
