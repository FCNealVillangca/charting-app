import Highcharts from "highcharts";
import type { Drawing } from "./chart-types";
import { extendLineToRange } from "./chart-utils";

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
  drawings: Drawing[],
  chartDataLength: number = 0,
  yMin: number = -Infinity,
  yMax: number = Infinity
): Highcharts.SeriesOptionsType[] {
  return drawings.flatMap((drawing) =>
    drawing.series.flatMap((s, index) => {
      const baseOptions = createBaseSeriesOptions(drawing, index, s.points);
      const color = drawing.color || (drawing.type === "line" ? "#ff6b35" : (drawing.type === "channel" ? "#000000" : "#4caf50"));

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
              color: "#000000", // Black like boundary dots
              marker: createMarker("#000000", 4, "circle"), // Same size as boundary dots
              lineWidth: 0,
            } as Highcharts.SeriesScatterOptions;
          }
          
          if (isDashedLine && s.points.length >= 2) {
            // Only extend if channel is complete
            const isComplete = !drawing.metadata?.isIncomplete;
            let lineData = s.points.map((p) => [p.x, p.y]);
            
            if (isComplete && chartDataLength > 0 && s.points.length >= 2) {
              const [p1, p2] = extendLineToRange(
                s.points[0],
                s.points[1],
                0,
                chartDataLength - 1,
                yMin,
                yMax
              );
              lineData = [[p1.x, p1.y], [p2.x, p2.y]];
            }
            
            // Render dashed line (no draggable markers on the line endpoints)
            return {
              ...baseOptions,
              data: lineData,
              type: "line" as const,
              color: "#888888", // Gray for dashed line
              marker: { enabled: false }, // No markers on dashed line
              lineWidth: 1,
              dashStyle: "Dash",
              enableMouseTracking: false, // Can't interact with dashed line
            } as Highcharts.SeriesLineOptions;
          }
          
          // Render boundary lines with extension
          if (s.points.length >= 2) {
            // Extend the line if it has 2 points, regardless of completion status
            // For incomplete channels, only extend the first series (base line)
            const isComplete = !drawing.metadata?.isIncomplete;
            const isBaseLine = index === 0; // First series is the base line
            
            const shouldExtend = chartDataLength > 0 && (isComplete || isBaseLine);
            
            if (shouldExtend) {
              // Extend line to chart boundaries
              const [p1, p2] = extendLineToRange(
                s.points[0],
                s.points[1],
                0,
                chartDataLength - 1,
                yMin,
                yMax
              );
              
              // Return both the extended line (non-interactive) and control points (interactive)
              return [
                // Extended line without markers
                {
                  name: `${drawing.name} - ${index + 1} (line)`,
                  data: [[p1.x, p1.y], [p2.x, p2.y]],
                  type: "line" as const,
                  color,
                  marker: { enabled: false },
                  lineWidth: 2,
                  showInLegend: false,
                  enableMouseTracking: false,
                } as Highcharts.SeriesLineOptions,
                // Control points with markers (interactive)
                {
                  ...baseOptions,
                  type: "scatter" as const,
                  color,
                  marker: createMarker(color, 4),
                  lineWidth: 0,
                } as Highcharts.SeriesScatterOptions,
              ] as any;
            } else {
              // Incomplete parallel line (not base line) - render normal line
              return {
                ...baseOptions,
                type: "line" as const,
                color,
                marker: createMarker(color, 4),
                lineWidth: 2,
              } as Highcharts.SeriesLineOptions;
            }
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

