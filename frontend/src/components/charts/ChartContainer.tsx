import React, { useContext } from "react";
import BaseChart from "./BaseChart";
import Sidebar from "./Sidebar";
import SeriesSidebar from "./SeriesSidebar";
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
    clearDrawings,
    resetZoom,
    toggleCrosshair,
    toggleDotMode,
  } = chartContext;

  return (
    <>
      <style>{`
        .chart-container {
          display: flex;
          height: 100%;
          width: 100%;
        }
        .chart-main {
          flex: 1;
          margin-left: 8px;
          position: relative;
          height: 100%;
          display: flex;
        }
        .chart-content {
          flex: 1;
          position: relative;
        }
        @media (max-width: 768px) {
          .chart-container {
            flex-direction: column;
          }
          .chart-main {
            margin-left: 0;
            margin-top: 8px;
            flex-direction: column;
          }
          .chart-content {
            height: 60vh;
          }
        }
        @media (max-width: 480px) {
          .chart-content {
            height: 50vh;
          }
        }
      `}</style>
      <div className="chart-container">
        <Sidebar
          activeTool={activeTool}
          onResetZoom={resetZoom}
          onToggleCrosshair={toggleCrosshair}
          onToggleDotMode={toggleDotMode}
          onClearSeries={clearDrawings}
        />
        <div className="chart-main">
          <div className="chart-content">
            <BaseChart
              ref={chartRef}
              data={data}
              activeTool={activeTool}
              onChartCreated={(newChart) => {
                setChart(newChart);
              }}
            />
          </div>
          <SeriesSidebar />
        </div>
      </div>
    </>
  );
};

export default ChartContainer;
