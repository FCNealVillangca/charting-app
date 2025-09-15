import { useRef, useMemo, useImperativeHandle, forwardRef } from "react";
import Plot from "react-plotly.js";
import type { DataPoint } from "./types";
import type { PlotlyHTMLElement } from "plotly.js";

// Exposed imperative API
export interface BaseChartRef {
  resetZoom: () => void;
  getChart: () => PlotlyHTMLElement | null;
}

// Props
interface BaseChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  onChartCreated?: (chart: PlotlyHTMLElement) => void;
}

const BaseChart = forwardRef<BaseChartRef, BaseChartProps>(
  ({ data, width, height, onChartCreated }, ref) => {
    const chartRef = useRef<PlotlyHTMLElement | null>(null);
    const plotlyInstanceRef = useRef<Plotly.Plotly | null>(null); // 👈 Renamed for clarity

    const chartData = useMemo(() => {
      if (data.length === 0) return [];

      const seen = new Map<number, DataPoint>();
      for (const item of data) {
        if (
          item &&
          typeof item.time === "number" &&
          !isNaN(item.time) &&
          typeof item.open === "number" &&
          !isNaN(item.open) &&
          typeof item.high === "number" &&
          !isNaN(item.high) &&
          typeof item.low === "number" &&
          !isNaN(item.low) &&
          typeof item.close === "number" &&
          !isNaN(item.close)
        ) {
          if (!seen.has(item.time)) {
            seen.set(item.time, item);
          }
        }
      }
      return Array.from(seen.values()).sort((a, b) => a.time - b.time);
    }, [data]);

    const plotlyData = useMemo(() => {
      if (chartData.length === 0) return [];

      return [
        {
          type: "candlestick",
          x: chartData.map((d) => new Date(d.time * 1000)),
          open: chartData.map((d) => d.open),
          high: chartData.map((d) => d.high),
          low: chartData.map((d) => d.low),
          close: chartData.map((d) => d.close),
          increasing: {
            line: { color: "#089981", width: 1 },
            fillcolor: "#089981",
          },
          decreasing: {
            line: { color: "#f23645", width: 1 },
            fillcolor: "#f23645",
          },
          name: "Price",
          showlegend: false,
        },
      ];
    }, [chartData]);

    const layout = useMemo(
      () => ({
        width,
        height,
        showlegend: false,
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { color: "#333333" },
        margin: { l: 60, r: 60, t: 20, b: 40 },
        xaxis: {
          type: "date",
          rangeslider: { visible: false },
          gridcolor: "#e0e0e0",
          linecolor: "#cccccc",
          tickcolor: "#666666",
          tickfont: { color: "#333333" },
          showgrid: true,
          autorange: true,
          fixedrange: false,
          tickmode: "auto",
          tickformat: "%H:%M\n%d %b",
        },
        yaxis: {
          title: { font: { color: "#333333" } },
          gridcolor: "#e0e0e0",
          linecolor: "#cccccc",
          tickcolor: "#666666",
          tickfont: { color: "#333333" },
          showgrid: true,
          zeroline: false,
          fixedrange: false,
          autorange: true,
        },
      }),
      [width, height]
    );

    // ✅ FIXED: Use Plotly from callback, not window
    const resetZoom = () => {
      const Plotly = plotlyInstanceRef.current; // 👈 Use saved instance
      if (chartRef.current && Plotly) {
        Plotly.relayout(chartRef.current, {
          "xaxis.autorange": true,
          "yaxis.autorange": true,
        });
      } else {
        console.warn("Plotly or chart element not ready for reset.");
      }
    };

    useImperativeHandle(ref, () => ({
      resetZoom,
      getChart: () => chartRef.current,
    }));

    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <Plot
          data={plotlyData}
          layout={layout}
          config={{
            displayModeBar: true,
            responsive: true,
            staticPlot: false,
            scrollZoom: true,
            doubleClick: "reset+autosize",
            showTips: true,
            showLink: false,
            sendData: false,
            displaylogo: false,
            modeBarButtonsToRemove: ["toImage", "sendDataToCloud"],
          }}
          onInitialized={(_figure, graphDiv, Plotly) => {
            // ✅ CRITICAL FIX: Save Plotly from callback argument
            chartRef.current = graphDiv;
            plotlyInstanceRef.current = Plotly; // 👈 This is the real Plotly!

            if (onChartCreated) {
              onChartCreated(graphDiv);
            }
          }}
          style={{
            width: "100%",
            height: "100%",
            minHeight: height ? `${height}px` : "400px",
          }}
        />

        {/* ✅ WORKING RESET BUTTON */}
        <button
          onClick={resetZoom}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            zIndex: 10,
            padding: "6px 12px",
            background: "#f23645",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          }}
          aria-label="Reset zoom"
        >
          Reset View
        </button>
      </div>
    );
  }
);

BaseChart.displayName = "BaseChart";

export default BaseChart;
