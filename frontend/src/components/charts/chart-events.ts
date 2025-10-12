import Highcharts from "highcharts";
import type { DataPoint, Drawing } from "./chart-types";
import { handleNoneTool, handleShapeTool, handleLineTool, handleChannelTool } from "./chart-tools";

/**
 * Handles mouse movement for tooltip display and cursor management
 */
export function createHandleMouseMove(
  chartInstance: { current: Highcharts.Chart | null },
  chartData: DataPoint[],
  selectedData: { drawingId: string; seriesId: string; pointId: string } | null,
  setTooltipData: (data: {
    visible: boolean;
    x: number;
    y: number;
    data: DataPoint | null;
  }) => void
) {
  return (e: MouseEvent) => {
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
    }
  };
}

/**
 * Handles keyboard input for chart navigation
 */
export function createHandleKeyDown(
  chartInstance: { current: Highcharts.Chart | null }
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
  chartInstance: { current: Highcharts.Chart | null }
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
    }
  };
}
