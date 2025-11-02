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
import type { DataPoint } from "./chart-types";
import { ChartContext } from "./chart-context";
import SeriesSidebar from "./series-sidebar";
import Sidebar from "./sidebar";
import { renderDrawingSeries } from "./chart-renderers";
import {
  createHandleMouseMove,
  createHandleMouseLeave,
  createHandleMouseUp,
  createHandleMouseDown,
  createHandleKeyDown,
  createHandleWheel,
  maybeLogChartStart,
} from "./chart-events";

// Exposed imperative API
export interface BaseChartRef {
  resetZoom: () => void;
  getChart: () => Highcharts.Chart | null;
  clearSeries: () => void;
}

interface ChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  onChartCreated?: (chart: HTMLDivElement) => void;
  onReachStart?: () => void;
}

const Chart = forwardRef<BaseChartRef, ChartProps>(
  ({ data, onChartCreated, onReachStart }, ref) => {
    const chartRef = useRef<HTMLDivElement | null>(null);
    const chartInstance = useRef<Highcharts.Chart | null>(null);
    const prevDataLengthRef = useRef<number>(0);
    const {
      drawings,
      addDrawing,
      clearDrawings,
      updatePoint,
      updateDrawing,
      selectedData,
      setSelectedData,
      setSelectedDrawingId,
      findPoints,
      completeDrawing,
      addPointToDrawing,
      activeTool,
      isLoading,
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
      const result = Array.from(seen.values()).sort((a, b) => a.time - b.time);
      if (data.length !== result.length) {
      }
      return result;
    }, [data]);

    const highchartsData = useMemo(() => {
      if (chartData.length === 0) return [];
      const result = chartData.map((d, index) => [
        index, // Use index instead of time to avoid gaps
        d.open,
        d.high,
        d.low,
        d.close,
      ]);
      return result;
    }, [chartData]);

    // Calculate y-axis range for line extension
    const yAxisRange = useMemo(() => {
      if (chartData.length === 0) return { min: 0, max: 0 };
      
      let min = Infinity;
      let max = -Infinity;
      
      for (const d of chartData) {
        if (d.low < min) min = d.low;
        if (d.high > max) max = d.high;
      }
      
      // Add large padding (200% on each side) for line extension without clamping
      const range = max - min;
      const padding = range * 2;
      return {
        min: min - padding,
        max: max + padding
      };
    }, [chartData]);

    const options = useMemo(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (): any => ({
        chart: {
          type: "candlestick",
          backgroundColor: "transparent",
          animation: false,
          zoomType: "x", // Enable horizontal zoom
          panning: {
            enabled: true, // Enable panning
            type: "x",
          },
          panKey: "shift",
          resetZoomButton: null,
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
          events: {
            afterSetExtremes: function () {
              // Log when index 0 becomes visible and trigger callback
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              maybeLogChartStart(this as any, onReachStart);
            },
          },
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
            text: "",
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
          ...renderDrawingSeries(drawings, chartData, yAxisRange.min, yAxisRange.max),
        ],
        plotOptions: {
          candlestick: {
            color: "#f23645",
            upColor: "#089981",
            lineColor: "#f23645",
            upLineColor: "#089981",
          },
          series: {
            animation: false, // Disable all series animations including transitions
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
      [highchartsData, drawings, chartData, activeTool, selectedData, yAxisRange]
    );

    const resetZoomChart = () => {
      if (chartInstance.current) {
        chartInstance.current.zoomOut();
      }
    };

    useImperativeHandle(ref, () => ({
      resetZoom: resetZoomChart,
      getChart: () => chartInstance.current,
      clearSeries: clearDrawings,
    }));

    // Create chart only once on mount
    useEffect(() => {
      const chartElement = chartRef.current;
      if (chartElement && highchartsData.length > 0 && !chartInstance.current) {
        // Create new chart
        chartInstance.current = Highcharts.chart(chartElement, options);
        prevDataLengthRef.current = highchartsData.length;

        // Force consistent initial viewport - always show last 400 candles
        const dataLength = highchartsData.length;
        const visibleCandles = 400;
        chartInstance.current.xAxis[0].setExtremes(
          Math.max(0, dataLength - visibleCandles),
          dataLength - 1,
          true,
          false
        );

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
    }, [onChartCreated]);

    // Update candlestick data when highchartsData changes (without recreating chart)
    useEffect(() => {
      if (chartInstance.current && highchartsData.length > 0) {
        const chart = chartInstance.current;
        const candlestickSeries = chart.series[0];
        
        if (candlestickSeries) {
          // Save current extremes before updating data
          const xAxis = chart.xAxis[0];
          const extremes = xAxis.getExtremes();
          const wasZoomed = extremes.min !== extremes.dataMin || extremes.max !== extremes.dataMax;
          
          // Calculate data length change
          const currentDataLength = highchartsData.length;
          const prevDataLength = prevDataLengthRef.current;
          const dataLengthChange = currentDataLength - prevDataLength;
          
          // Update the series data without animation to prevent flicker
          candlestickSeries.setData(highchartsData, false, false, false);
          
          // If user was zoomed/panned and data length changed, adjust extremes
          if (wasZoomed && dataLengthChange !== 0) {
            const adjustedMin = extremes.min + dataLengthChange;
            const adjustedMax = extremes.max + dataLengthChange;
            xAxis.setExtremes(adjustedMin, adjustedMax, false, false);
          }
          
          // Update previous data length
          prevDataLengthRef.current = currentDataLength;
          
          // Redraw chart once after all updates
          chart.redraw(false);
        }
      }
    }, [highchartsData]);


    // Update drawing series when drawings change
    useEffect(() => {
      if (chartInstance.current && highchartsData.length > 0) {
        const chart = chartInstance.current;
        const xAxis = chart.xAxis[0];
        const yAxis = chart.yAxis[0];
        
        // 🔒 SAVE current axis extremes BEFORE updating series
        const xExtremes = xAxis.getExtremes();
        const yExtremes = yAxis.getExtremes();
        
        const drawingSeries = renderDrawingSeries(drawings, chartData, yAxisRange.min, yAxisRange.max);
        
        // Remove old drawing series (keep only candlestick at index 0)
        while (chart.series.length > 1) {
          chart.series[chart.series.length - 1].remove(false);
        }
        
        // Add new drawing series
        drawingSeries.forEach(series => {
          chart.addSeries(series, false);
        });
        
        // 🔒 RESTORE axis extremes AFTER updating series (prevents auto-scale)
        xAxis.setExtremes(xExtremes.min, xExtremes.max, false, false);
        yAxis.setExtremes(yExtremes.min, yExtremes.max, false, false);
        
        // Redraw once after all updates
        chart.redraw(false);
      }
    }, [drawings, chartData, yAxisRange]);

    useEffect(() => {
      const handleResize = () => {
        if (chartInstance.current) {
          chartInstance.current.reflow();
        }
      };

      // Create all event handlers
      const handleMouseMove = createHandleMouseMove(
        chartInstance,
        chartData,
        selectedData,
        activeTool,
        findPoints,
        setTooltipData,
        onReachStart
      );
      const handleMouseLeave = createHandleMouseLeave(setTooltipData);
      const handleMouseUp = createHandleMouseUp(
        chartInstance,
        chartData,  // Added: Pass chartData for index->timestamp conversion
        selectedData,
        updatePoint,
        setSelectedData
      );
      const handleMouseDown = createHandleMouseDown(
        chartInstance,
        chartData,  // Added: Pass chartData for index->timestamp conversion
        activeTool,
        drawings,
        selectedData,
        findPoints,
        setSelectedData,
        setSelectedDrawingId,
        addDrawing,
        addPointToDrawing,
        completeDrawing,
        updateDrawing
      );
      const handleKeyDown = createHandleKeyDown(chartInstance, onReachStart);
      const handleWheel = createHandleWheel(chartInstance, onReachStart);

      window.addEventListener("resize", handleResize);
      window.addEventListener("keydown", handleKeyDown);

      // Add event listeners to the chart container
      const chartElement = chartRef.current;
      if (chartElement) {
        chartElement.addEventListener("wheel", handleWheel, {
          passive: false,
        });
        chartElement.addEventListener("mousemove", handleMouseMove);
        chartElement.addEventListener("mouseleave", handleMouseLeave);
        // Use capture phase to intercept mousedown BEFORE Highcharts zoom
        chartElement.addEventListener("mousedown", handleMouseDown, true);
        chartElement.addEventListener("mouseup", handleMouseUp);
      }

      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("keydown", handleKeyDown);
        if (chartElement) {
          chartElement.removeEventListener("wheel", handleWheel);
          chartElement.removeEventListener("mousemove", handleMouseMove);
          chartElement.removeEventListener("mouseleave", handleMouseLeave);
          // Remove with capture: true to match how it was added
          chartElement.removeEventListener("mousedown", handleMouseDown, true);
          chartElement.removeEventListener("mouseup", handleMouseUp);
        }
      };
    }, [
      activeTool,
      drawings,
      selectedData,
      addDrawing,
      chartData,
      findPoints,
      updatePoint,
      updateDrawing,
      setSelectedData,
      setSelectedDrawingId,
      addPointToDrawing,
      completeDrawing,
    ]);

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
          .highcharts-reset-zoom {
            display: none !important;
          }
        `}</style>
        <div className="chart-container" style={{ cursor: isLoading ? 'wait' : 'default' }}>
          <Sidebar />
          <div className="chart-main">
            <div className="chart-content">
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <div
                  ref={chartRef}
                  style={{ position: "relative", width: "100%", height: "100%", cursor: isLoading ? 'wait' : 'default' }}
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
              </div>
            </div>
            <SeriesSidebar />
          </div>
        </div>
      </>
    );
  }
);

Chart.displayName = "Chart";
export default Chart;
