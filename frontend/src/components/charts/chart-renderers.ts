import Highcharts from "highcharts";
import type { Drawing, DataPoint } from "./chart-types";
import { extendLineToRange, timestampToIndex } from "./chart-utils";

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
 * NOTE: Drawings store timestamps in x, we convert to indices for rendering
 */
export function renderDrawingSeries(
  drawings: Drawing[],
  chartData: DataPoint[],  // Changed: Need full chartData to convert timestamps
  yMin: number = -Infinity,
  yMax: number = Infinity
): Highcharts.SeriesOptionsType[] {
  const chartDataLength = chartData.length;
  
  return drawings.flatMap((drawing) =>
    drawing.series.flatMap((s, index) => {
      // Convert timestamps (stored in x) to indices for rendering
      const pointsWithIndices = s.points.map(p => ({
        x: timestampToIndex(p.x, chartData),  // Convert timestamp -> index
        y: p.y
      })).filter(p => p.x !== -1);  // Filter out points not found in current data
      
      const baseOptions = createBaseSeriesOptions(drawing, index, pointsWithIndices);
      const color = (s as any)?.style?.color || "#000000"; // color per series

      switch (drawing.type) {
        case "line":
          // Complete line with 2+ points - render as line
          if (pointsWithIndices.length >= 2) {
            return {
              ...baseOptions,
              type: "line" as const,
              color,
              lineColor: color,
              marker: createMarker(color, 4, "circle"),
              lineWidth: 2,
            } as Highcharts.SeriesLineOptions;
          } else {
            // Incomplete line - render first point as scatter
            return {
              ...baseOptions,
              type: "scatter" as const,
              color,
              marker: createMarker(color, 4, "circle"),
              lineWidth: 0,
            } as Highcharts.SeriesScatterOptions;
          }

        case "channel":
          // Derive by name
          const isCenterPoint = s?.name === 'tlinecenter' || s.points.length === 1;
          const isDashedLine = s?.name === 'tlinemid';
          
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
          
          if (isDashedLine && pointsWithIndices.length >= 2) {
            // Only extend if channel is complete
            const isComplete = !drawing.isIncomplete;
            let lineData = pointsWithIndices.map((p) => [p.x, p.y]);
            
            if (isComplete && chartDataLength > 0 && pointsWithIndices.length >= 2) {
              const [p1, p2] = extendLineToRange(
                pointsWithIndices[0],
                pointsWithIndices[1],
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
          if (pointsWithIndices.length >= 2) {
            // Extend the line if it has 2 points, regardless of completion status
            // For incomplete channels, only extend the first series (base line)
            const isComplete = !drawing.isIncomplete;
            const isBaseLine = index === 0; // First series is the base line
            
            const shouldExtend = chartDataLength > 0 && (isComplete || isBaseLine);
            
            if (shouldExtend) {
              // Extend line to chart boundaries
              const [p1, p2] = extendLineToRange(
                pointsWithIndices[0],
                pointsWithIndices[1],
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
                  lineColor: color,
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
                  marker: createMarker(color, 4, "circle"),
                  lineWidth: 0,
                } as Highcharts.SeriesScatterOptions,
              ] as any;
            } else {
              // Incomplete parallel line (not base line) - render normal line
              return {
                ...baseOptions,
                type: "line" as const,
                color,
                lineColor: color,
                marker: createMarker(color, 4, "circle"),
                lineWidth: 2,
              } as Highcharts.SeriesLineOptions;
            }
          } else {
            // Incomplete channel - render first point as scatter
            return {
              ...baseOptions,
              type: "scatter" as const,
              color,
              marker: createMarker(color, 4, "circle"),
              lineWidth: 0,
            } as Highcharts.SeriesScatterOptions;
          }

        case "hline":
          // Horizontal line - extends across entire chart at a fixed y-value
          if (s.points.length >= 1) {
            const yValue = s.points[0].y;
            
            return {
              name: drawing.name,
              data: [[0, yValue], [chartDataLength - 1, yValue]],
              type: "line" as const,
              color,
              lineColor: color,
              marker: { enabled: false },
              lineWidth: 2,
              showInLegend: false,
              enableMouseTracking: false,
            } as Highcharts.SeriesLineOptions;
          } else {
            return [];
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

