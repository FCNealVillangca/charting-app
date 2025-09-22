import {
  useRef,
  useMemo,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useState,
  useContext,
} from "react";
import Highcharts from "highcharts";
import "highcharts/highcharts-more";
import "highcharts/modules/stock";
import type { DataPoint } from "./types";
import { ChartContext } from "./chartContext";
import { getRandomChartColor } from "./colorUtils";

// Exposed imperative API
export interface BaseChartRef {
  resetZoom: () => void;
  getChart: () => Highcharts.Chart | null;
  clearSeries: () => void;
}

interface BaseChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  onChartCreated?: (chart: HTMLDivElement) => void;
  activeTool?: string;
}

const BaseChart = forwardRef<BaseChartRef, BaseChartProps>(
  ({ data, onChartCreated, activeTool = "none" }, ref) => {
    const chartRef = useRef<HTMLDivElement | null>(null);
    const chartInstance = useRef<Highcharts.Chart | null>(null);
    const {
      series,
      addSeries,
      clearSeries,
      updatePoint,
      selectedData,
      setSelectedData,
      findPoints,
    } = useContext(ChartContext)!;
    const [tooltipData, setTooltipData] = useState<{
      visible: boolean;
      x: number;
      y: number;
      data: DataPoint | null;
    }>({ visible: false, x: 0, y: 0, data: null });

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
      return chartData.map((d, index) => [
        index, // Use index instead of time to avoid gaps
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
          zoomType: false, // Disable zoom
          panning: {
            enabled: true,
            type: "x", // Enable panning on x-axis only (time)
          },
          panKey: "shift", // Hold Shift key to pan instead of zoom
          resetZoomButton: null, // Completely remove the reset zoom button
        },

        title: {
          text: "",
        },
        xAxis: {
          type: "linear",
          labels: {
            formatter: function () {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const index = (this as any).value;
              if (index >= 0 && index < chartData.length) {
                const date = new Date(chartData[index].time * 1000);
                return date.toLocaleDateString();
              }
              return "";
            },
          },
          gridLineWidth: 1,
          gridLineColor: "#e0e0e0",
          minRange: 100, // Minimum zoom range (100 data points)
          crosshair: {
            enabled: true,
            color: "#666",
            width: 1,
            dashStyle: "dash",
            zIndex: 4,
          },
        },
        yAxis: {
          title: {
            text: "Price",
          },
          gridLineWidth: 1,
          gridLineColor: "#e0e0e0",
          minRange: 0.1, // Minimum zoom range for price
          crosshair: {
            enabled: true,
            color: "#666",
            width: 1,
            dashStyle: "dash",
            zIndex: 4,
          },
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
          ...series.map(
            (s, index) =>
              ({
                type: "scatter" as const,
                name: s.name || `Series ${index + 1}`,
                data: s.points.map((p) => [p.x, p.y]),
                color: s.color || "#ff6b35",
                marker: {
                  radius: 4,
                  fillColor: s.color || "#ff6b35",
                  lineColor: "#fff",
                  lineWidth: 2,
                  states: {
                    hover: {
                      enabled: false, // Disable marker hover effects
                    },
                  },
                },
                showInLegend: false,
                enableMouseTracking: true,
              } as Highcharts.SeriesScatterOptions)
          ),
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
                enabled: false, // Disable hover effects to keep points consistent
              },
              inactive: {
                opacity: 1, // Keep full opacity when series is inactive
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
          enabled: false, // Disable the default tooltip
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
      [highchartsData, series, chartData]
    );

    const resetZoom = () => {
      if (chartInstance.current) {
        chartInstance.current.zoomOut();
      }
    };

    useImperativeHandle(ref, () => ({
      resetZoom,
      getChart: () => chartInstance.current,
      clearSeries,
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

      const handleKeyDown = (e: KeyboardEvent) => {
        if (!chartInstance.current) return;

        const xAxis = chartInstance.current.xAxis[0];
        const extremes = xAxis.getExtremes();
        const panStep = (extremes.max - extremes.min) / 10; // Pan 10% of current range

        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            xAxis.setExtremes(extremes.min - panStep, extremes.max - panStep);
            break;
          case "ArrowRight":
            e.preventDefault();
            xAxis.setExtremes(extremes.min + panStep, extremes.max + panStep);
            break;
          case "Home":
            e.preventDefault();
            // Reset to show all data
            xAxis.setExtremes(undefined, undefined);
            break;
        }
      };

      const handleWheel = (e: WheelEvent) => {
        if (!chartInstance.current) return;

        // Check if Shift key is held down
        if (e.shiftKey) {
          e.preventDefault();

          const xAxis = chartInstance.current.xAxis[0];
          const extremes = xAxis.getExtremes();
          const panStep = (extremes.max - extremes.min) / 20; // Pan 5% of current range

          // Determine pan direction based on wheel delta
          const panAmount = e.deltaY > 0 ? panStep : -panStep;

          xAxis.setExtremes(extremes.min + panAmount, extremes.max + panAmount);
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!chartInstance.current) return;

        const chart = chartInstance.current;
        const xAxis = chart.xAxis[0];

        // Get mouse position relative to chart
        const rect = chart.container.getBoundingClientRect();
        const x = e.clientX - rect.left;

        // Show tooltip
        const xValue = xAxis.toValue(x);
        const index = Math.round(xValue);
        if (index >= 0 && index < chartData.length) {
          const dataPoint = chartData[index];
          setTooltipData({
            visible: true,
            x: rect.left + 10, // Upper left of chart
            y: rect.top + 10,
            data: dataPoint,
          });
        }

        // Set cursor
        if (selectedData) {
          document.body.style.cursor = "grab";
        } else {
          document.body.style.cursor = "";
        }
      };

      const handleMouseLeave = () => {
        setTooltipData({ visible: false, x: 0, y: 0, data: null });
        document.body.style.cursor = "";
      };

      const handleMouseUp = (e: MouseEvent) => {
        if (!chartInstance.current || !selectedData) return;

        const chart = chartInstance.current;
        const xAxis = chart.xAxis[0];
        const yAxis = chart.yAxis[0];

        // Get mouse position relative to chart
        const rect = chart.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert to axis values
        const xValue = xAxis.toValue(x);
        const yValue = yAxis.toValue(y);

        // Update the selected point position and deselect
        updatePoint(
          selectedData.seriesId,
          selectedData.pointId,
          xValue,
          yValue
        );
        setSelectedData(null);
        e.preventDefault(); // Prevent zoom
      };

      const handleMouseDown = (e: MouseEvent) => {
        if (!chartInstance.current) return;

        const chart = chartInstance.current;
        const xAxis = chart.xAxis[0];
        const yAxis = chart.yAxis[0];

        // Get mouse position relative to chart
        const rect = chart.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convert to axis values
        const xValue = xAxis.toValue(x);
        const yValue = yAxis.toValue(y);
        const foundPoint = findPoints(xValue, yValue);
        console.log("foundPoint", foundPoint);
        console.log("selectedData", selectedData);
        console.log("activeTool", activeTool);

        if (activeTool === "none" || activeTool === null) {
          e.preventDefault(); // Prevent zoom selection
          if (!selectedData) {
            // Find and select series at the point
            if (foundPoint) {
              setSelectedData(foundPoint);
            }
          }
        } else if (activeTool === "dot") {
          e.preventDefault(); // Prevent zoom
          // Create a new series
          const seriesNumber = series.length + 1;
          const newSeries = {
            id: `series_${Date.now()}_${Math.random()}`,
            name: `Series ${seriesNumber}`,
            color: getRandomChartColor(),
            points: [
              {
                id: `point_${Date.now()}_${Math.random()}`,
                x: xValue,
                y: yValue,
              },
            ],
          };

          console.log(newSeries);
          addSeries(newSeries);
        }
      };

      window.addEventListener("resize", handleResize);
      window.addEventListener("keydown", handleKeyDown);

      // Add event listeners to the chart container
      const chartElement = chartRef.current;
      if (chartElement) {
        chartElement.addEventListener("wheel", handleWheel, { passive: false });
        chartElement.addEventListener("mousemove", handleMouseMove);
        chartElement.addEventListener("mouseleave", handleMouseLeave);
        chartElement.addEventListener("mousedown", handleMouseDown);
        chartElement.addEventListener("mouseup", handleMouseUp);
      }

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("keydown", handleKeyDown);
        if (chartElement) {
          chartElement.removeEventListener("wheel", handleWheel);
          chartElement.removeEventListener("mousemove", handleMouseMove);
          chartElement.removeEventListener("mouseleave", handleMouseLeave);
          chartElement.removeEventListener("mousedown", handleMouseDown);
          chartElement.removeEventListener("mouseup", handleMouseUp);
        }
      };
    }, [
      activeTool,
      series,
      selectedData,
      addSeries,
      chartData,
      findPoints,
      updatePoint,
      setSelectedData,
    ]);

    // Debug: Log series changes
    useEffect(() => {
      console.log("Series updated:", series);
    }, [series]);

    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <div
          ref={chartRef}
          style={{ position: "relative", width: "100%", height: "100%" }}
        />
        {tooltipData.visible && tooltipData.data && (
          <div
            style={{
              position: "fixed",
              left: tooltipData.x,
              top: tooltipData.y,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              border: "1px solid #333",
              borderRadius: "4px",
              padding: "8px",
              minWidth: "120px",
              color: "#fff",
              fontSize: "12px",
              fontFamily: "monospace",
              zIndex: 1000,
              pointerEvents: "none",
            }}
          >
            <div
              style={{ fontWeight: "bold", marginBottom: "4px", color: "#fff" }}
            >
              {new Date(tooltipData.data.time * 1000).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                }
              )}{" "}
              {new Date(tooltipData.data.time * 1000).toLocaleTimeString(
                "en-US",
                {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                margin: "2px 0",
              }}
            >
              <span style={{ color: "#888" }}>O:</span>
              <span style={{ color: "#fff" }}>
                {tooltipData.data.open.toFixed(5)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                margin: "2px 0",
              }}
            >
              <span style={{ color: "#888" }}>H:</span>
              <span style={{ color: "#4caf50" }}>
                {tooltipData.data.high.toFixed(5)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                margin: "2px 0",
              }}
            >
              <span style={{ color: "#888" }}>L:</span>
              <span style={{ color: "#f44336" }}>
                {tooltipData.data.low.toFixed(5)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                margin: "2px 0",
              }}
            >
              <span style={{ color: "#888" }}>C:</span>
              <span style={{ color: "#fff" }}>
                {tooltipData.data.close.toFixed(5)}
              </span>
            </div>
          </div>
        )}
        <style>{`
          .highcharts-reset-zoom {
            display: none !important;
          }
        `}</style>
      </div>
    );
  }
);

BaseChart.displayName = "BaseChart";
export default BaseChart;
