import type { EChartsInstance } from "echarts-for-react";
import type { DataPoint, Drawing } from "./chart-types";
import { handleNoneTool, handleShapeTool, handleLineTool, handleChannelTool, handleHLineTool } from "./chart-tools";

/**
 * Handles mouse movement for tooltip display and cursor management
 */
export function createHandleMouseMove(
  getChartInstance: () => EChartsInstance | null,
  chartData: DataPoint[],
  selectedData: { drawingId: string; seriesId: string; pointId: string } | null,
  activeTool: string,
  findPoints: (
    x: number,
    y: number,
    xTolerance?: number,
    yTolerance?: number
  ) => { drawingId: string; seriesId: string; pointId: string } | null,
  setTooltipData: (data: {
    visible: boolean;
    x: number;
    y: number;
    data: DataPoint | null;
  }) => void
) {
  return (e: MouseEvent) => {
    const chart = getChartInstance();
    if (!chart) return;

    // Get the chart DOM element
    const chartDom = chart.getDom();
    const rect = chartDom.getBoundingClientRect();
    
    // Convert pixel coordinates to chart values
    const pixelPoint = [e.clientX - rect.left, e.clientY - rect.top];
    const dataPoint = chart.convertFromPixel({ seriesIndex: 0 }, pixelPoint);
    
    if (!dataPoint) return;
    
    const xValue = dataPoint[0];
    const yValue = dataPoint[1];

    // Show tooltip
    const index = Math.round(xValue);
    if (index >= 0 && index < chartData.length) {
      const dataPointInfo = chartData[index];
      setTooltipData({
        visible: true,
        x: rect.left + 10, // Upper left of chart
        y: rect.top + 10,
        data: dataPointInfo,
      });
    }

    // Set cursor based on context
    if (selectedData) {
      // Currently dragging a point
      document.body.style.cursor = "grabbing";
    } else {
      // Check if hovering over a point
      const hoveringPoint = findPoints(xValue, yValue);
      
      if (hoveringPoint) {
        // Hovering over a draggable point
        document.body.style.cursor = "pointer";
      } else if (activeTool !== "none" && activeTool !== null) {
        // Drawing tool is active
        document.body.style.cursor = "crosshair";
      } else {
        // Default cursor
        document.body.style.cursor = "";
      }
    }
  };
}

/**
 * Handles mouse leaving the chart area
 */
export function createHandleMouseLeave(
  setTooltipData: (data: {
    visible: boolean;
    x: number;
    y: number;
    data: DataPoint | null;
  }) => void
) {
  return () => {
    setTooltipData({ visible: false, x: 0, y: 0, data: null });
    document.body.style.cursor = "";
  };
}

/**
 * Handles mouse button release for point dragging
 */
export function createHandleMouseUp(
  getChartInstance: () => EChartsInstance | null,
  selectedData: { drawingId: string; seriesId: string; pointId: string } | null,
  updatePoint: (
    drawingId: string,
    seriesId: string,
    pointId: string,
    x: number,
    y: number
  ) => void,
  setSelectedData: (
    point: { drawingId: string; seriesId: string; pointId: string } | null
  ) => void
) {
  return (e: MouseEvent) => {
    const chart = getChartInstance();
    if (!chart || !selectedData) return;

    // Get the chart DOM element
    const chartDom = chart.getDom();
    const rect = chartDom.getBoundingClientRect();
    
    // Convert pixel coordinates to chart values
    const pixelPoint = [e.clientX - rect.left, e.clientY - rect.top];
    const dataPoint = chart.convertFromPixel({ seriesIndex: 0 }, pixelPoint);
    
    if (!dataPoint) return;
    
    const xValue = dataPoint[0];
    const yValue = dataPoint[1];

    // Update the selected point position and deselect
    updatePoint(
      selectedData.drawingId,
      selectedData.seriesId,
      selectedData.pointId,
      xValue,
      yValue
    );
    setSelectedData(null);
    e.preventDefault(); // Prevent zoom
  };
}

/**
 * Handles mouse button press for tool actions
 */
export function createHandleMouseDown(
  getChartInstance: () => EChartsInstance | null,
  activeTool: string,
  drawings: Drawing[],
  selectedData: { drawingId: string; seriesId: string; pointId: string } | null,
  findPoints: (
    x: number,
    y: number,
    xTolerance?: number,
    yTolerance?: number
  ) => { drawingId: string; seriesId: string; pointId: string } | null,
  setSelectedData: (
    point: { drawingId: string; seriesId: string; pointId: string } | null
  ) => void,
  setSelectedDrawingId: (drawingId: string | null) => void,
  addDrawing: (drawing: Drawing) => void,
  addPointToDrawing: (
    drawingId: string,
    seriesId: string,
    point: { x: number; y: number }
  ) => void,
  completeDrawing: (drawingId: string) => void,
  updateDrawing: (drawingId: string, updates: Partial<Drawing>) => void
) {
  return (e: MouseEvent) => {
    const chart = getChartInstance();
    if (!chart) return;

    // Get the chart DOM element
    const chartDom = chart.getDom();
    const rect = chartDom.getBoundingClientRect();
    
    // Convert pixel coordinates to chart values
    const pixelPoint = [e.clientX - rect.left, e.clientY - rect.top];
    const dataPoint = chart.convertFromPixel({ seriesIndex: 0 }, pixelPoint);
    
    if (!dataPoint) return;
    
    const xValue = dataPoint[0];
    const yValue = dataPoint[1];

    // Prepare common parameters for tool handlers
    const toolHandlerParams = {
      xValue,
      yValue,
      drawings,
      selectedData,
      findPoints,
      setSelectedData,
      setSelectedDrawingId,
      addDrawing,
      addPointToDrawing,
      completeDrawing,
      updateDrawing,
    };

    if (activeTool === "none" || activeTool === null) {
      e.preventDefault(); // Prevent zoom selection
      handleNoneTool(toolHandlerParams);
    } else if (
      activeTool === "dot" ||
      activeTool === "triangle" ||
      activeTool === "square" ||
      activeTool === "circle" ||
      activeTool === "diamond"
    ) {
      e.preventDefault(); // Prevent zoom
      handleShapeTool({ ...toolHandlerParams, toolType: activeTool });
    } else if (activeTool === "line") {
      e.preventDefault(); // Prevent zoom
      handleLineTool(toolHandlerParams);
    } else if (activeTool === "channel") {
      e.preventDefault(); // Prevent zoom
      handleChannelTool(toolHandlerParams);
    } else if (activeTool === "hline") {
      e.preventDefault(); // Prevent zoom
      handleHLineTool(toolHandlerParams);
    }
  };
}

/**
 * Handles keyboard input for chart navigation
 */
export function createHandleKeyDown(
  getChartInstance: () => EChartsInstance | null
) {
  return (e: KeyboardEvent) => {
    const chart = getChartInstance();
    if (!chart) return;

    // Get current dataZoom state
    const option = chart.getOption() as any;
    const dataZoom = option.dataZoom?.[0];
    
    if (!dataZoom) return;
    
    const start = dataZoom.start || 0;
    const end = dataZoom.end || 100;
    const range = end - start;
    const panStep = range / 10; // Pan 10% of current range

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        chart.dispatchAction({
          type: 'dataZoom',
          start: Math.max(0, start - panStep),
          end: Math.max(panStep, end - panStep),
        });
        break;
      case "ArrowRight":
        e.preventDefault();
        chart.dispatchAction({
          type: 'dataZoom',
          start: Math.min(100 - range, start + panStep),
          end: Math.min(100, end + panStep),
        });
        break;
      case "Home":
        e.preventDefault();
        // Reset to show all data
        chart.dispatchAction({
          type: 'dataZoom',
          start: 0,
          end: 100,
        });
        break;
    }
  };
}

/**
 * Handles mouse wheel for panning when Shift is held
 */
export function createHandleWheel(
  getChartInstance: () => EChartsInstance | null
) {
  return (e: WheelEvent) => {
    const chart = getChartInstance();
    if (!chart) return;

    // Check if Shift key is held down
    if (e.shiftKey) {
      e.preventDefault();

      // Get current dataZoom state
      const option = chart.getOption() as any;
      const dataZoom = option.dataZoom?.[0];
      
      if (!dataZoom) return;
      
      const start = dataZoom.start || 0;
      const end = dataZoom.end || 100;
      const range = end - start;
      const panStep = range / 20; // Pan 5% of current range

      // Determine pan direction based on wheel delta
      const panAmount = e.deltaY > 0 ? panStep : -panStep;

      chart.dispatchAction({
        type: 'dataZoom',
        start: Math.max(0, Math.min(100 - range, start + panAmount)),
        end: Math.max(range, Math.min(100, end + panAmount)),
      });
    }
  };
}
