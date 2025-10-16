import {
  useRef,
  useMemo,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useState,
  useContext,
  useCallback,
} from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsInstance } from "echarts-for-react";
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
} from "./chart-events";

// Exposed imperative API
export interface BaseChartRef {
  resetZoom: () => void;
  getChart: () => EChartsInstance | null;
  clearSeries: () => void;
}

interface ChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  onChartCreated?: (chart: HTMLDivElement) => void;
}

const Chart = forwardRef<BaseChartRef, ChartProps>(
  ({ data, onChartCreated }, ref) => {
    const chartRef = useRef<ReactECharts | null>(null);
    const chartContainerRef = useRef<HTMLDivElement | null>(null);
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

    // Convert data to ECharts candlestick format: [x, open, close, low, high]
    const echartsData = useMemo(() => {
      if (chartData.length === 0) return [];
      return chartData.map((d, index) => [
        index, // Use index instead of time to avoid gaps
        d.open,
        d.close,
        d.low,
        d.high,
      ]);
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
      () => ({
        animation: false,
        grid: {
          left: 60,
          right: 60,
          top: 40,
          bottom: 60,
          backgroundColor: 'transparent',
        },
        xAxis: {
          type: 'value',
          min: 0,
          max: chartData.length > 0 ? chartData.length - 1 : 100,
          axisLabel: {
            formatter: (value: number) => {
              const index = Math.round(value);
              if (index >= 0 && index < chartData.length) {
                const date = new Date(chartData[index].time * 1000);
                return date.toLocaleDateString();
              }
              return "";
            },
          },
          axisPointer: {
            show: true,
            lineStyle: {
              color: '#666',
              width: 1,
              type: 'dashed',
            },
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#e0e0e0',
            },
          },
        },
        yAxis: {
          type: 'value',
          scale: true,
          axisPointer: {
            show: true,
            lineStyle: {
              color: '#666',
              width: 1,
              type: 'dashed',
            },
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#e0e0e0',
            },
          },
        },
        series: [
          {
            type: 'candlestick',
            name: 'Price',
            data: echartsData,
            itemStyle: {
              color: '#089981',      // up candle color
              color0: '#f23645',     // down candle color
              borderColor: '#089981',
              borderColor0: '#f23645',
            },
          },
          ...renderDrawingSeries(drawings, chartData.length, yAxisRange.min, yAxisRange.max),
        ],
        tooltip: {
          show: false,
        },
        toolbox: {
          show: false,
        },
        dataZoom: [
          {
            type: 'inside',
            xAxisIndex: 0,
            disabled: activeTool !== 'none',
            zoomOnMouseWheel: 'ctrl',
            moveOnMouseMove: true,
            moveOnMouseWheel: false,
            preventDefaultMouseMove: false,
          },
        ],
      }),
      [echartsData, drawings, chartData, activeTool, yAxisRange]
    );

    const getChartInstance = useCallback((): EChartsInstance | null => {
      return chartRef.current?.getEchartsInstance() || null;
    }, []);

    const resetZoomChart = useCallback(() => {
      const instance = getChartInstance();
      if (instance) {
        instance.dispatchAction({
          type: 'dataZoom',
          start: 0,
          end: 100,
        });
      }
    }, [getChartInstance]);

    useImperativeHandle(ref, () => ({
      resetZoom: resetZoomChart,
      getChart: getChartInstance,
      clearSeries: clearDrawings,
    }));

    useEffect(() => {
      if (chartContainerRef.current && onChartCreated) {
        onChartCreated(chartContainerRef.current);
      }
    }, [onChartCreated]);

    useEffect(() => {
      const handleResize = () => {
        const instance = getChartInstance();
        if (instance) {
          instance.resize();
        }
      };

      // Create all event handlers
      const handleMouseMove = createHandleMouseMove(
        getChartInstance,
        chartData,
        selectedData,
        activeTool,
        findPoints,
        setTooltipData
      );
      const handleMouseLeave = createHandleMouseLeave(setTooltipData);
      const handleMouseUp = createHandleMouseUp(
        getChartInstance,
        selectedData,
        updatePoint,
        setSelectedData
      );
      const handleMouseDown = createHandleMouseDown(
        getChartInstance,
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
      const handleKeyDown = createHandleKeyDown(getChartInstance);
      const handleWheel = createHandleWheel(getChartInstance);

      window.addEventListener("resize", handleResize);
      window.addEventListener("keydown", handleKeyDown);

      // Add event listeners to the chart container
      const chartElement = chartContainerRef.current;
      if (chartElement) {
        chartElement.addEventListener("wheel", handleWheel, {
          passive: false,
        });
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
      getChartInstance,
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
        `}</style>
        <div className="chart-container">
          <Sidebar />
          <div className="chart-main">
            <div className="chart-content">
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <div
                  ref={chartContainerRef}
                  style={{ position: "relative", width: "100%", height: "100%" }}
                >
                  <ReactECharts
                    ref={chartRef}
                    option={options}
                    style={{ height: "100%", width: "100%" }}
                    opts={{ renderer: 'canvas' }}
                  />
                </div>
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
