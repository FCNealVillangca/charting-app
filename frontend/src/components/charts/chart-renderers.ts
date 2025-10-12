import Highcharts from "highcharts";
import type { Drawing } from "./chart-types";

/**
 * Creates a marker configuration object
 */
function createMarker(
  color: string,
  radius: number,
  symbol?: string
): Highcharts.PointMarkerOptionsObject {
  return {
    radius,
    ...(symbol && { symbol }),
    fillColor: color,
    lineColor: "#fff",
    lineWidth: 2,
    states: {
      hover: {
        enabled: false,
      },
    },
  };
}

/**
 * Creates base series options common to all drawing types
 */
function createBaseSeriesOptions(
  drawing: Drawing,
  seriesIndex: number,
  points: { x: number; y: number }[]
) {
  return {
    name: `${drawing.name} - ${seriesIndex + 1}`,
    data: points.map((p) => [p.x, p.y]),
    showInLegend: false,
    enableMouseTracking: true,
  };
}

/**
 * Renders drawings as Highcharts series
 * Handles different drawing types: lines, dots, and shapes
 */
export function renderDrawingSeries(
  drawings: Drawing[]
): Highcharts.SeriesOptionsType[] {
  return drawings.flatMap((drawing) =>
    drawing.series.map((s, index) => {
      const baseOptions = createBaseSeriesOptions(drawing, index, s.points);
      const color = drawing.color || (drawing.type === "line" ? "#ff6b35" : "#4caf50");

      switch (drawing.type) {
        case "line":
          // Complete line with 2+ points - render as line
          if (s.points.length >= 2) {
            return {
              ...baseOptions,
              type: "line" as const,
              color,
              marker: createMarker(color, 4),
              lineWidth: 2,
            } as Highcharts.SeriesLineOptions;
          } else {
            // Incomplete line - render first point as scatter
            return {
              ...baseOptions,
              type: "scatter" as const,
              color,
              marker: createMarker(color, 4),
              lineWidth: 0,
            } as Highcharts.SeriesScatterOptions;
          }

        case "channel":
          // Check if this is the center point (4th series with 1 point)
          const isCenterPoint = drawing.metadata?.centerSeriesId === s.id;
          // Check if this is the dashed line (3rd series)
          const isDashedLine = drawing.metadata?.dashedSeriesId === s.id;
          
          if (isCenterPoint) {
            // Render center point as a single draggable dot
            return {
              ...baseOptions,
              type: "scatter" as const,
              color: "#FF9800", // Orange for center point
              marker: createMarker("#FF9800", 4, "circle"), // Same size as boundary dots
              lineWidth: 0,
            } as Highcharts.SeriesScatterOptions;
          }
          
          if (isDashedLine && s.points.length >= 2) {
            // Render dashed line (no draggable markers on the line endpoints)
            return {
              ...baseOptions,
              type: "line" as const,
              color: "#888888", // Gray for dashed line
              marker: { enabled: false }, // No markers on dashed line
              lineWidth: 1,
              dashStyle: "Dash",
              enableMouseTracking: false, // Can't interact with dashed line
            } as Highcharts.SeriesLineOptions;
          }
          
          // Render boundary lines
          if (s.points.length >= 2) {
            return {
              ...baseOptions,
              type: "line" as const,
              color,
              marker: createMarker(color, 4),
              lineWidth: 2,
            } as Highcharts.SeriesLineOptions;
          } else {
            // Incomplete channel - render first point as scatter
            return {
              ...baseOptions,
              type: "scatter" as const,
              color,
              marker: createMarker(color, 4),
              lineWidth: 0,
            } as Highcharts.SeriesScatterOptions;
          }

        case "dot":
        case "triangle":
        case "square":
        case "circle":
        case "diamond":
        default:
          // Shape drawing types - use drawing type as symbol, or "circle" for dot
          const symbol = drawing.type === "dot" ? "circle" : drawing.type;
          return {
            ...baseOptions,
            type: "scatter" as const,
            color,
            marker: createMarker(color, 6, symbol),
            lineWidth: 0,
          } as Highcharts.SeriesScatterOptions;
      }
    })
  );
}

