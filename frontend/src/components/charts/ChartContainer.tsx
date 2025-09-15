import React, { useRef } from "react";
import type { PlotlyHTMLElement } from "plotly.js";
import BaseChart from "./BaseChart";
import Sidebar from "./Sidebar";
import type { DataPoint } from "./types";
import type { BaseChartRef } from "./BaseChart";

interface ChartContainerProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  // Toolbar customization options
  showToolbar?: boolean;
  customToolbarConfig?: {
    buttonsToRemove?: string[];
    buttonsToAdd?: Plotly.ModeBarButton[];
    customConfig?: Partial<Plotly.Config>;
  };
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  data,
  width,
  height,
  showToolbar = true,
  customToolbarConfig = {},
}) => {
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
    <div style={{ display: "flex", height: "100%" }}>
      <Sidebar
        onResetZoom={handleResetZoom}
        onToggleCrosshair={handleToggleCrosshair}
      />
      <div style={{ flex: 1, marginLeft: "8px", position: "relative" }}>
        <BaseChart
          ref={chartRef}
          data={data}
          width={width}
          height={height}
          showToolbar={showToolbar}
          toolbarButtonsToRemove={customToolbarConfig.buttonsToRemove}
          toolbarButtonsToAdd={customToolbarConfig.buttonsToAdd}
          customToolbarConfig={customToolbarConfig.customConfig}
          onChartCreated={(newChart) => {
            setChart(newChart);
          }}
        />
      </div>
    </div>
  );
};

export default ChartContainer;
