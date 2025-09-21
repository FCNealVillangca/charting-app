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
    <div
      style={{
        width: "300px",
        padding: "16px",
        backgroundColor: "#f5f5f5",
        borderLeft: "1px solid #ddd",
        overflowY: "auto",
        fontFamily: "monospace",
        fontSize: "12px",
      }}
    >
      <h3>Chart State</h3>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
};

export default SeriesSidebar;
