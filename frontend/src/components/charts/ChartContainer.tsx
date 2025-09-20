import React, { useContext } from "react";
import BaseChart from "./BaseChart";
import Sidebar from "./Sidebar";
import type { DataPoint } from "./types";
import { ChartContext } from "./chartContext";

interface ChartContainerProps {
  data: DataPoint[];
}

const ChartContainer: React.FC<ChartContainerProps> = ({ data }) => {
  const [, setChart] = React.useState<HTMLDivElement | null>(null);
  const chartContext = useContext(ChartContext);

  if (!chartContext) {
    throw new Error("ChartContainer must be used within a ChartProvider");
  }

  const {
    chartRef,
    activeTool,
    clearSeries,
    resetZoom,
    toggleCrosshair,
    toggleDotMode,
  } = chartContext;

  return (
    <div style={{ display: "flex", height: "100%", width: "100%" }}>
      <Sidebar
        onResetZoom={resetZoom}
        onToggleCrosshair={toggleCrosshair}
        onToggleDotMode={toggleDotMode}
        onClearSeries={clearSeries}
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
