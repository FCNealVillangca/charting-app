import React, { useRef } from "react";
import type { PlotlyHTMLElement } from "plotly.js";
import BaseChart from "./BaseChart";
import Sidebar from "./Sidebar";
import type { DataPoint } from "./types";
import type { BaseChartRef } from "./BaseChart";

interface ChartContainerProps {
  data: DataPoint[];
}

const ChartContainer: React.FC<ChartContainerProps> = ({ data }) => {
  const [, setChart] = React.useState<PlotlyHTMLElement | null>(null);
  const chartRef = useRef<BaseChartRef>(null);

  const handleResetZoom = () => {
    console.log("Reset zoom clicked");
    chartRef.current?.resetZoom();
  };

  const handleToggleCrosshair = () => {
    // Simple crosshair toggle - just show an alert for now
    alert("Crosshair functionality coming soon!");
  };

  return (
    <div style={{ display: "flex", height: "100%", width: "100%" }}>
      <Sidebar
        onResetZoom={handleResetZoom}
        onToggleCrosshair={handleToggleCrosshair}
      />
      <div
        style={{
          flex: 1,
          marginLeft: "8px",
          position: "relative",
          height: "100%",
        }}
      >
        <BaseChart
          ref={chartRef}
          data={data}
          onChartCreated={(newChart) => {
            setChart(newChart);
          }}
        />
      </div>
    </div>
  );
};

export default ChartContainer;
