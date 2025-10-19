import Highcharts from "highcharts";
import type { DataPoint, Drawing } from "./chart-types";
import { handleNoneTool, handleShapeTool, handleLineTool, handleChannelTool, handleHLineTool } from "./chart-tools";

// Simple debounce to avoid multiple alerts in quick succession
let lastEndAlertTime = 0;

/**
 * Check if index 0 (leftmost/oldest data) is visible in the chart view
 */
export function checkIfAtChartStart(
  xAxis: Highcharts.Axis,
  tolerancePoints: number = 5
): boolean {
  const extremes = xAxis.getExtremes();
  if (typeof extremes.min !== "number") {
    return false;
  }
  
  // Check if we're viewing index 0 (leftmost data)
  const isAtStart = extremes.min <= tolerancePoints;
  if (isAtStart) {
  }
  return isAtStart;
}

/**
 * Console log when index 0 is visible (debounced) and trigger callback
 */
export function maybeLogChartStart(xAxis: Highcharts.Axis, onReachStart?: () => void) {
  if (checkIfAtChartStart(xAxis)) {
    const now = Date.now();
    if (now - lastEndAlertTime > 3000) { // 3 second debounce
      lastEndAlertTime = now;
      if (onReachStart) {
        onReachStart();
      } else {
      }
    }
  }
}

/**
 * Handles mouse movement for tooltip display and cursor management
 */
export function createHandleMouseMove(
  chartInstance: { current: Highcharts.Chart | null },
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
  }) => void,
  onReachStart?: () => void
) {
  return (e: MouseEvent) => {
    if (!chartInstance.current) return;

    const chart = chartInstance.current;
    const xAxis = chart.xAxis[0];
    const yAxis = chart.yAxis[0];

    // Check if we've reached the start and trigger callback
    maybeLogChartStart(xAxis, onReachStart);

    // Get mouse position relative to chart
    const rect = chart.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

    // Set cursor based on context
    if (selectedData) {
      // Currently dragging a point
      document.body.style.cursor = "grabbing";
    } else {
      // Check if hovering over a point
      const yValue = yAxis.toValue(y);
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
  chartInstance: { current: Highcharts.Chart | null },
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
  chartInstance: { current: Highcharts.Chart | null },
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

    // Check if clicking on a draggable point (for "none" tool mode)
    const clickedPoint = findPoints(xValue, yValue);
    
    // ALWAYS prevent default zoom behavior when:
    // 1. Clicking on a draggable point (to drag it)
    // 2. Using any drawing tool
    if (clickedPoint || activeTool !== "none") {
      e.preventDefault();
      e.stopPropagation();
    }

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
      handleNoneTool(toolHandlerParams);
    } else if (
      activeTool === "dot" ||
      activeTool === "triangle" ||
      activeTool === "square" ||
      activeTool === "circle" ||
      activeTool === "diamond"
    ) {
      handleShapeTool({ ...toolHandlerParams, toolType: activeTool });
    } else if (activeTool === "line") {
      handleLineTool(toolHandlerParams);
    } else if (activeTool === "channel") {
      handleChannelTool(toolHandlerParams);
    } else if (activeTool === "hline") {
      handleHLineTool(toolHandlerParams);
    }
  };
}

/**
 * Handles keyboard input for chart navigation
 */
export function createHandleKeyDown(
  chartInstance: { current: Highcharts.Chart | null },
  onReachStart?: () => void
) {
  return (e: KeyboardEvent) => {
    if (!chartInstance.current) return;

    const xAxis = chartInstance.current.xAxis[0];
    const extremes = xAxis.getExtremes();
    const panStep = (extremes.max - extremes.min) / 10; // Pan 10% of current range

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        xAxis.setExtremes(extremes.min - panStep, extremes.max - panStep);
        // Check if we've reached the start after panning
        setTimeout(() => maybeLogChartStart(xAxis, onReachStart), 0);
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
}

/**
 * Handles mouse wheel for panning when Shift is held
 */
export function createHandleWheel(
  chartInstance: { current: Highcharts.Chart | null },
  onReachStart?: () => void
) {
  return (e: WheelEvent) => {
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
      
      // Check if we've reached the start after panning
      setTimeout(() => maybeLogChartStart(xAxis, onReachStart), 0);
    }
  };
}
