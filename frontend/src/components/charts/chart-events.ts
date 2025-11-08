import Highcharts from "highcharts";
import type { DataPoint, Drawing } from "./chart-types";
import { handleNoneTool, handleShapeTool, handleLineTool, handleChannelTool, handleHLineTool } from "./chart-tools";
import { axisValueToNearestPoint, axisDeltaToSeconds } from "./chart-utils";

// Simple debounce to avoid multiple alerts in quick succession
let lastEndAlertTime = 0;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const getBaseSpacing = (chartData: DataPoint[]): number =>
  chartData.length > 1 ? Math.max(chartData[1].time - chartData[0].time, 1) : 60;

const computeXToleranceSeconds = (
  axisDelta: number,
  chartData: DataPoint[]
): number => {
  const baseSpacing = getBaseSpacing(chartData);
  const raw = axisDeltaToSeconds(axisDelta, chartData);
  const fallback = baseSpacing / 2;
  return clamp(raw > 0 ? raw : fallback, baseSpacing / 4, baseSpacing * 2);
};

/**
 * Check if the leftmost/oldest data is visible in the chart view
 * Works with datetime x-axis by checking against the first data point's timestamp
 */
export function checkIfAtChartStart(
  xAxis: Highcharts.Axis,
  chartData: DataPoint[],
  tolerancePoints: number = 5
): boolean {
  const extremes = xAxis.getExtremes();
  
  if (typeof extremes.min !== "number") {
    return false;
  }
  
  if (!chartData || chartData.length === 0) {
    return false;
  }
  
  // Get the first data point's timestamp (convert to milliseconds for comparison with extremes)
  const firstTimestamp = chartData[0].time * 1000; // Convert from seconds to milliseconds
  if (typeof firstTimestamp !== "number") {
    return false;
  }
  
  // Convert tolerance from points to time range
  // Estimate time per point based on first few data points
  let timePerPoint = 15 * 60 * 1000; // Default: 15 minutes in ms
  if (chartData.length > 1) {
    timePerPoint = (chartData[1].time - chartData[0].time) * 1000; // Convert to ms
  }
  
  const toleranceTime = tolerancePoints * timePerPoint;
  
  // Check if we're viewing near the first timestamp
  const isAtStart = extremes.min <= firstTimestamp + toleranceTime;
  
  return isAtStart;
}

/**
 * Trigger callback when the leftmost data is visible (debounced)
 */
export function maybeLogChartStart(xAxis: Highcharts.Axis, chartData: DataPoint[], onReachStart?: () => void) {
  if (checkIfAtChartStart(xAxis, chartData)) {
    const now = Date.now();
    if (now - lastEndAlertTime > 3000) { // 3 second debounce
      lastEndAlertTime = now;
      if (onReachStart) {
        onReachStart();
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
  selectedData: { drawingId: number | null; seriesId: number | null; pointId: number | null } | null,
  activeTool: string,
  findPoints: (
    x: number,
    y: number,
    xTolerance?: number,
    yTolerance?: number
  ) => { drawingId: number | null; seriesId: number | null; pointId: number | null } | null,
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
    maybeLogChartStart(xAxis, chartData, onReachStart);

    // Get mouse position relative to chart
    const rect = chart.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xValue = xAxis.toValue(x);
    const nearestPoint = axisValueToNearestPoint(xValue, chartData);

    if (nearestPoint) {
      const dataPoint = chartData[nearestPoint.index];
      setTooltipData({
        visible: true,
        x: rect.left + 10, // Upper left of chart
        y: rect.top + 10,
        data: dataPoint,
      });
    } else {
      setTooltipData({
        visible: false,
        x: 0,
        y: 0,
        data: null,
      });
    }

    // Set cursor based on context
    if (selectedData) {
      // Currently dragging a point
      document.body.style.cursor = "grabbing";
    } else {
      // Check if hovering over a point using pixel-based tolerance converted to axis units
      const yValue = yAxis.toValue(y);
      const pixelTolerance = 6; // pixels
      const axisDelta = xAxis.toValue(x + pixelTolerance) - xValue;
      const xToleranceSeconds = computeXToleranceSeconds(axisDelta, chartData);
      const yTol = Math.abs(yAxis.toValue(y + pixelTolerance) - yAxis.toValue(y));
      const timestampForHitTest = nearestPoint?.timestamp ?? null;
      const hoveringPoint =
        timestampForHitTest === null
          ? null
          : findPoints(timestampForHitTest, yValue, xToleranceSeconds, yTol);
      
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


// TODo 
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
  chartData: DataPoint[],  // Added: Need chartData to convert index -> timestamp
  selectedData: { drawingId: number | null; seriesId: number | null; pointId: number | null } | null,
  updatePoint: (
    drawingId: number | null,
    seriesId: number | null,
    pointId: number | null,
    x: number,
    y: number
  ) => void,
  setSelectedData: (
    point: { drawingId: number | null; seriesId: number | null; pointId: number | null } | null
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
    
    const nearestPoint = axisValueToNearestPoint(xValue, chartData);
    if (!nearestPoint) return;
    const timestamp = nearestPoint.timestamp;

    // Update the selected point position and deselect (store timestamp in x)
    updatePoint(
      selectedData.drawingId,
      selectedData.seriesId,
      selectedData.pointId,
      timestamp,  // Store timestamp, not index
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
  chartData: DataPoint[],  // Added: Need chartData to convert index -> timestamp
  activeTool: string,
  drawings: Drawing[],
  selectedData: { drawingId: number | null; seriesId: number | null; pointId: number | null } | null,
  findPoints: (
    x: number,
    y: number,
    xTolerance?: number,
    yTolerance?: number
  ) => { drawingId: number | null; seriesId: number | null; pointId: number | null } | null,
  setSelectedData: (
    point: { drawingId: number | null; seriesId: number | null; pointId: number | null } | null
  ) => void,
  setSelectedDrawingId: (drawingId: number | null) => void,
  addDrawing: (drawing: Drawing) => void,
  addPointToDrawing: (
    drawingId: number | null,
    seriesId: number | null,
    point: { x: number; y: number }
  ) => void,
  completeDrawing: (drawingId: number | null) => void,
  updateDrawing: (drawingId: number | null, updates: Partial<Drawing>) => void
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
    
    const nearestPoint = axisValueToNearestPoint(xValue, chartData);
    if (!nearestPoint) return;
    const timestamp = nearestPoint.timestamp;

    // Check if clicking on a draggable point (for "none" tool mode) using pixel-based tolerance
    const pixelTolerance = 6; // pixels
    const axisDelta = xAxis.toValue(x + pixelTolerance) - xValue;
    const xToleranceSeconds = computeXToleranceSeconds(axisDelta, chartData);
    const yTol = Math.abs(yAxis.toValue(y + pixelTolerance) - yAxis.toValue(y));
    const clickedPoint = findPoints(timestamp, yValue, xToleranceSeconds, yTol);
    
    // ALWAYS prevent default zoom behavior when:
    // 1. Clicking on a draggable point (to drag it)
    // 2. Using any drawing tool
    if (clickedPoint || activeTool !== "none") {
      e.preventDefault();
      e.stopPropagation();
    }

    // Prepare common parameters for tool handlers
    // Wrap hit-test to always use the pixel-derived tolerances so handlers don't fall back to wide defaults
    const findWithTol = (
      xx: number,
      yy: number,
      _xT?: number,
      _yT?: number
    ) => findPoints(xx, yy, xToleranceSeconds, yTol);

    const toolHandlerParams = {
      timestamp,  // Changed: Pass timestamp instead of xValue (index)
      yValue,
      chartData,  // Added: Pass chartData for tools to use
      drawings,
      selectedData,
      findPoints: findWithTol,
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
  chartData: DataPoint[],
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
        setTimeout(() => maybeLogChartStart(xAxis, chartData, onReachStart), 0);
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
  chartData: DataPoint[],
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
      setTimeout(() => maybeLogChartStart(xAxis, chartData, onReachStart), 0);
    }
  };
}
