import {
  useRef,
  useMemo,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import Highcharts from "highcharts";
import "highcharts/highcharts-more";
import "highcharts/modules/stock";
import type { DataPoint } from "./types";

// Exposed imperative API
export interface BaseChartRef {
  resetZoom: () => void;
  getChart: () => Highcharts.Chart | null;
}

interface BaseChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  onChartCreated?: (chart: HTMLDivElement) => void;
}

const BaseChart = forwardRef<BaseChartRef, BaseChartProps>(
  ({ data, onChartCreated }, ref) => {
    const chartRef = useRef<HTMLDivElement | null>(null);
    const chartInstance = useRef<Highcharts.Chart | null>(null);

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

    const highchartsData = useMemo(() => {
      if (chartData.length === 0) return [];
      return chartData.map((d) => [
        d.time * 1000, // Convert to milliseconds for Highcharts
        d.open,
        d.high,
        d.low,
        d.close,
      ]);
    }, [chartData]);

    const options = useMemo(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (): any => ({
        chart: {
          type: "candlestick",
          backgroundColor: "transparent",
          animation: false,
          zoomType: "x", // Enable zoom on x-axis only (time)
          panning: {
            enabled: true,
            type: "x", // Enable panning on x-axis only (time)
          },
        },
        title: {
          text: "",
        },
        xAxis: {
          type: "datetime",
          labels: {
            format: "{value:%m/%d}",
          },
          gridLineWidth: 1,
          gridLineColor: "#e0e0e0",
          minRange: 24 * 3600 * 1000, // Minimum zoom range (1 day)
        },
        yAxis: {
          title: {
            text: "Price",
          },
          gridLineWidth: 1,
          gridLineColor: "#e0e0e0",
          minRange: 0.1, // Minimum zoom range for price
        },
        series: [
          {
            type: "candlestick",
            name: "Price",
            data: highchartsData,
            color: "#f23645",
            upColor: "#089981",
            lineColor: "#f23645",
            upLineColor: "#089981",
            colorByPoint: false,
            showInLegend: false,
          } as Highcharts.SeriesCandlestickOptions,
        ],
        plotOptions: {
          candlestick: {
            color: "#f23645",
            upColor: "#089981",
            lineColor: "#f23645",
            upLineColor: "#089981",
          },
          series: {
            enableMouseTracking: true,
            states: {
              hover: {
                enabled: true,
                brightness: 0.1,
              },
            },
          },
        },
        credits: {
          enabled: false,
        },
        legend: {
          enabled: false,
        },
        tooltip: {
          enabled: true,
          formatter: function () {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const context = this as any;
            const point = context.point;
            return `
            <b>${new Date(point.x).toLocaleDateString()}</b><br/>
            Open: ${point.open}<br/>
            High: ${point.high}<br/>
            Low: ${point.low}<br/>
            Close: ${point.close}
          `;
          },
        },
        rangeSelector: {
          enabled: false,
        },
        navigator: {
          enabled: false,
        },
        scrollbar: {
          enabled: false,
        },
        exporting: {
          enabled: false,
        },
        accessibility: {
          enabled: false,
        },
      }),
      [highchartsData]
    );

    const resetZoom = () => {
      if (chartInstance.current) {
        chartInstance.current.zoomOut();
      }
    };

    useImperativeHandle(ref, () => ({
      resetZoom,
      getChart: () => chartInstance.current,
    }));

    useEffect(() => {
      const chartElement = chartRef.current;
      if (chartElement && highchartsData.length > 0) {
        // Destroy existing chart if it exists
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        // Create new chart
        chartInstance.current = Highcharts.chart(chartElement, options);

        if (onChartCreated) {
          onChartCreated(chartElement);
        }
      }

      return () => {
        if (chartInstance.current) {
          chartInstance.current.destroy();
          chartInstance.current = null;
        }
      };
    }, [highchartsData, options, onChartCreated]);

    useEffect(() => {
      const handleResize = () => {
        if (chartInstance.current) {
          chartInstance.current.reflow();
        }
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <div
          ref={chartRef}
          style={{ position: "relative", width: "100%", height: "100%" }}
        />
      </div>
    );
  }
);

BaseChart.displayName = "BaseChart";
export default BaseChart;
