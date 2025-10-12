import React, { useContext, useState } from "react";
import { ChartContext } from "./chart-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  ChevronRight,
  Circle,
  Triangle,
  Square,
  Diamond,
  Dot,
} from "lucide-react";

// Define shapes with lucide icons
const SHAPES = [
  { value: "dot", Icon: Dot },
  { value: "triangle", Icon: Triangle },
  { value: "square", Icon: Square },
  { value: "circle", Icon: Circle },
  { value: "diamond", Icon: Diamond },
] as const;

const SidebarScatterButton: React.FC = () => {
  const chartContext = useContext(ChartContext);
  const activeTool = chartContext?.activeTool || "none";
  const [selectedShape, setSelectedShape] = useState<string>("dot");

  const handleMainButtonClick = () => {
    // Toggle the drawing mode for the selected shape
    if (activeTool === selectedShape) {
      chartContext?.setActiveTool("none");
    } else {
      chartContext?.setActiveTool(selectedShape);
    }
  };

  const handleShapeSelect = (shape: string) => {
    setSelectedShape(shape);
    // Activate the selected shape mode
    chartContext?.setActiveTool(shape);
  };

  const isActive = activeTool === selectedShape;
  const SelectedIcon = SHAPES.find((s) => s.value === selectedShape)?.Icon || Dot;

  return (
    <div className="flex flex-row justify-start">
      <button
        className={`h-8 w-8 flex items-center justify-center ${isActive ? "bg-gray-200" : "bg-white"}`}
        title="Toggle Dot Placement"
        onClick={handleMainButtonClick}
      >
        <SelectedIcon className="size-4" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={"outline-none w-4 flex items-center justify-center"}>
            <ChevronRight className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {SHAPES.map(({ value, Icon }, index) => (
            <DropdownMenuItem key={index} onClick={() => handleShapeSelect(value)}>
              <Icon className="mr-2 size-4" />
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SidebarScatterButton;
