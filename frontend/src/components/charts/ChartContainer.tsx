import React, { useRef } from "react";
import BaseChart from "./BaseChart";
import Sidebar from "./Sidebar";
import type { DataPoint } from "./types";
import type { BaseChartRef } from "./BaseChart";

interface ChartContainerProps {
  data: DataPoint[];
}

const ChartContainer: React.FC<ChartContainerProps> = ({ data }) => {
  const [, setChart] = React.useState<HTMLDivElement | null>(null);
  const chartRef = useRef<BaseChartRef>(null);
  const [activeTool, setActiveTool] = React.useState<string>("none");

  const handleResetZoom = () => {
    console.log("Reset zoom clicked");
    chartRef.current?.resetZoom();
  };

  const handleToggleCrosshair = () => {
    // Simple crosshair toggle - just show an alert for now
    alert("Crosshair functionality coming soon!");
  };

  const handleToggleDotMode = () => {
    setActiveTool(activeTool === "none" ? "dot" : "none");
  };

  return (
    <div style={{ display: "flex", height: "100%", width: "100%" }}>
      <Sidebar
        onResetZoom={handleResetZoom}
        onToggleCrosshair={handleToggleCrosshair}
        onToggleDotMode={handleToggleDotMode}
      />
      <div
        style={{
          flex: 1,
          marginLeft: "8px",
          position: "relative",
          height: "100%",
          display: "flex",
        }}
      >
        <div style={{ flex: 1, position: "relative" }}>
          <BaseChart
            ref={chartRef}
            data={data}
            activeTool={activeTool}
            onChartCreated={(newChart) => {
              setChart(newChart);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartContainer;
