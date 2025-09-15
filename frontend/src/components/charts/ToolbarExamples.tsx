import React from "react";
import ChartContainer from "./ChartContainer";
import type { DataPoint } from "./types";

// Sample data for demonstration
const sampleData: DataPoint[] = [
  { time: 1640995200, open: 1.1234, high: 1.125, low: 1.122, close: 1.124 },
  { time: 1640998800, open: 1.124, high: 1.126, low: 1.123, close: 1.125 },
  { time: 1641002400, open: 1.125, high: 1.127, low: 1.124, close: 1.126 },
  { time: 1641006000, open: 1.126, high: 1.128, low: 1.125, close: 1.127 },
  { time: 1641009600, open: 1.127, high: 1.129, low: 1.126, close: 1.128 },
];

const ToolbarExamples: React.FC = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Chart Toolbar Customization Examples</h2>

      {/* Example 1: Minimal Toolbar */}
      <div style={{ marginBottom: "40px" }}>
        <h3>1. Minimal Toolbar (Only Zoom and Pan)</h3>
        <div style={{ height: "400px", border: "1px solid #ccc" }}>
          <ChartContainer
            data={sampleData}
            showToolbar={true}
            customToolbarConfig={{
              buttonsToRemove: [
                "autoScale2d",
                "resetScale2d",
                "hoverClosestCartesian",
                "hoverCompareCartesian",
                "toggleSpikelines",
                "pan2d",
                "zoom2d",
                "select2d",
                "lasso2d",
                "toImage",
                "sendDataToCloud",
              ],
              customConfig: {
                // Keep only zoom and pan buttons
                modeBarButtonsToRemove: [
                  "autoScale2d",
                  "resetScale2d",
                  "hoverClosestCartesian",
                  "hoverCompareCartesian",
                  "toggleSpikelines",
                  "select2d",
                  "lasso2d",
                  "toImage",
                  "sendDataToCloud",
                ],
              },
            }}
          />
        </div>
      </div>

      {/* Example 2: No Toolbar */}
      <div style={{ marginBottom: "40px" }}>
        <h3>2. No Toolbar</h3>
        <div style={{ height: "400px", border: "1px solid #ccc" }}>
          <ChartContainer data={sampleData} showToolbar={false} />
        </div>
      </div>

      {/* Example 3: Custom Toolbar with Image Export */}
      <div style={{ marginBottom: "40px" }}>
        <h3>3. Custom Toolbar with Image Export</h3>
        <div style={{ height: "400px", border: "1px solid #ccc" }}>
          <ChartContainer
            data={sampleData}
            showToolbar={true}
            customToolbarConfig={{
              buttonsToRemove: [
                "select2d",
                "lasso2d",
                "sendDataToCloud",
                "hoverClosestCartesian",
                "hoverCompareCartesian",
                "toggleSpikelines",
              ],
              customConfig: {
                toImageButtonOptions: {
                  format: "png",
                  filename: "trading-chart",
                  height: 600,
                  width: 800,
                  scale: 2,
                },
              },
            }}
          />
        </div>
      </div>

      {/* Example 4: Full Toolbar */}
      <div style={{ marginBottom: "40px" }}>
        <h3>4. Full Toolbar (All Default Buttons)</h3>
        <div style={{ height: "400px", border: "1px solid #ccc" }}>
          <ChartContainer
            data={sampleData}
            showToolbar={true}
            customToolbarConfig={{
              buttonsToRemove: [], // Remove nothing
              customConfig: {
                displaylogo: true, // Show Plotly logo
                showTips: true,
                showLink: true,
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ToolbarExamples;
