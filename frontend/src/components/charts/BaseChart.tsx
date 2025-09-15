import { useRef, useMemo, useImperativeHandle, forwardRef } from "react";
import Plot from "react-plotly.js";
import type { DataPoint } from "./types";
import type { PlotlyHTMLElement } from "plotly.js";

// Exposed imperative API
export interface BaseChartRef {
  resetZoom: () => void;
  getChart: () => PlotlyHTMLElement | null;
}

interface BaseChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  onChartCreated?: (chart: PlotlyHTMLElement) => void;
}

const BaseChart = forwardRef<BaseChartRef, BaseChartProps>(
  ({ data, onChartCreated }, ref) => {
    const chartRef = useRef<PlotlyHTMLElement | null>(null);

    const chartData = useMemo(() => {
      const seen = new Map<number, DataPoint>();
      for (const item of data) {
        if (
          item &&
          typeof item.time === "number" &&
          !isNaN(item.time) &&
          typeof item.open === "number" &&
          typeof item.high === "number" &&
          typeof item.low === "number" &&
          typeof item.close === "number"
        ) {
          if (!seen.has(item.time)) seen.set(item.time, item);
        }
      }
      return Array.from(seen.values()).sort((a, b) => a.time - b.time);
    }, [data]);

    const plotlyData = useMemo(() => {
      if (chartData.length === 0) return [];
      return [
        {
          type: "candlestick" as const,
          x: chartData.map((_, index) => index), // Use continuous index for no gaps
          open: chartData.map((d) => d.open),
          high: chartData.map((d) => d.high),
          low: chartData.map((d) => d.low),
          close: chartData.map((d) => d.close),
          increasing: { line: { color: "#089981" } },
          decreasing: { line: { color: "#f23645" } },
          showlegend: false,
        },
      ];
    }, [chartData]);

    const layout = useMemo(
      () => ({
        autosize: true, // Enable responsive sizing - no fixed width/height
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        margin: { l: 60, r: 60, t: 20, b: 40 },
        xaxis: {
          type: "date" as const,
          rangeslider: { visible: false },
          autorange: true,
          tickmode: "auto" as const, // Let Plotly automatically choose tick positions
          tickformat: "%m/%d", // Format as MM/DD
        },
        yaxis: {
          autorange: true,
          fixedrange: false,
        },
        modebar: {
          orientation: "v" as const, // Force vertical orientation
        },
      }),
      []
    );

    // ✅ Reset zoom using window.Plotly, which react-plotly.js attaches
    const resetZoom = () => {
      if (
        chartRef.current &&
        typeof window !== "undefined" &&
        "Plotly" in window
      ) {
        (
          window as typeof window & { Plotly: typeof import("plotly.js") }
        ).Plotly.relayout(chartRef.current, {
          "xaxis.autorange": true,
          "yaxis.autorange": true,
        });
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
            scrollZoom: true,
            doubleClick: "reset+autosize",
            displaylogo: false,
            responsive: true, // Enable responsive behavior
            toImageButtonOptions: {
              format: "png",
              filename: "chart",
              height: 500,
              width: 700,
              scale: 1,
            },
          }}
          onInitialized={(_figure, graphDiv) => {
            chartRef.current = graphDiv;
            if (onChartCreated) onChartCreated(graphDiv);
          }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    );
  }
);

BaseChart.displayName = "BaseChart";
export default BaseChart;
