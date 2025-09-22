import React, { useContext } from "react";
import { ChartContext } from "./chartContext";

const SeriesSidebar: React.FC = () => {
  const chartContext = useContext(ChartContext);

  if (!chartContext) {
    return null;
  }

  const { series, selectedData, activeTool } = chartContext;

  const state = {
    series,
    selectedData,
    activeTool,
  };

  return (
    <>
      <style>{`
        .series-sidebar {
          width: 300px;
          padding: 16px;
          background-color: #f5f5f5;
          border-left: 1px solid #ddd;
          overflow-y: auto;
          font-family: monospace;
          font-size: 12px;
        }
        @media (max-width: 768px) {
          .series-sidebar {
            width: 100%;
            border-left: none;
            border-top: 1px solid #ddd;
            max-height: 30vh;
            font-size: 10px;
          }
        }
      `}</style>
      <div className="series-sidebar">
        <h3>Chart State</h3>
        <pre>{JSON.stringify(state, null, 2)}</pre>
      </div>
    </>
  );
};

export default SeriesSidebar;
