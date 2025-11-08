import Highcharts from "highcharts";
import type { Drawing, DataPoint } from "./chart-types";
import {
  extendLineToRange,
  drawingXToTimestamp,
  axisDeltaToSeconds,
} from "./chart-utils";

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
  chartData: DataPoint[],
  yMin: number = -Infinity,
  yMax: number = Infinity
): Highcharts.SeriesOptionsType[] {
  const hasData = chartData.length > 0;
  const startTime = hasData ? chartData[0].time : 0;
  const endTime = hasData ? chartData[chartData.length - 1].time : 0;
  const timeSpan = Math.max(endTime - startTime, 1);
  const extendMinTime = hasData ? startTime - timeSpan : startTime - 86400;
  const extendMaxTime = hasData ? endTime + timeSpan : endTime + 86400;

  const toHighchartsData = (points: { x: number; y: number }[]): [number, number][] =>
    points.map((p) => [p.x * 1000, p.y]);

  return drawings.flatMap((drawing) =>
    drawing.series.flatMap((s, index) => {
      const pointsWithTime = s.points
        .map((p) => {
          const timestamp = drawingXToTimestamp(p.x, chartData);
          if (timestamp === null) return null;
          return { x: timestamp, y: p.y };
        })
        .filter((p): p is { x: number; y: number } => p !== null);

      const baseOptions = createBaseSeriesOptions(drawing, index, pointsWithTime);
      const color = (s as any)?.style?.color || "#000000";

      switch (drawing.type) {
        case "line":
          // Complete line with 2+ points - render as line
          if (pointsWithTime.length >= 2) {
            return {
              ...baseOptions,
              data: toHighchartsData(pointsWithTime),
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
              data: toHighchartsData(pointsWithTime),
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
              data: toHighchartsData(pointsWithTime),
              type: "scatter" as const,
              color: "#000000",
              marker: createMarker("#000000", 4, "circle"),
              lineWidth: 0,
            } as Highcharts.SeriesScatterOptions;
          }
          
          if (isDashedLine && pointsWithTime.length >= 2) {
            const isComplete = !drawing.isIncomplete;
            let linePoints = pointsWithTime;

            if (isComplete && pointsWithTime.length >= 2) {
              const [p1, p2] = extendLineToRange(
                pointsWithTime[0],
                pointsWithTime[1],
                extendMinTime,
                extendMaxTime,
                yMin,
                yMax
              );
              linePoints = [p1, p2];
            }
            
            // Render dashed line (no draggable markers on the line endpoints)
            return {
              ...baseOptions,
              data: toHighchartsData(linePoints),
              type: "line" as const,
              color: "#888888", // Gray for dashed line
              marker: { enabled: false }, // No markers on dashed line
              lineWidth: 1,
              dashStyle: "Dash",
              enableMouseTracking: false, // Can't interact with dashed line
            } as Highcharts.SeriesLineOptions;
          }
          
          // Render boundary lines with extension
          if (pointsWithTime.length >= 2) {
            const isComplete = !drawing.isIncomplete;
            const isBaseLine = index === 0; // First series is the base line
            
            const shouldExtend = pointsWithTime.length >= 2 && (isComplete || isBaseLine);
            
            if (shouldExtend) {
              // Extend line to chart boundaries
              const [p1, p2] = extendLineToRange(
                pointsWithTime[0],
                pointsWithTime[1],
                extendMinTime,
                extendMaxTime,
                yMin,
                yMax
              );
              
              // Return both the extended line (non-interactive) and control points (interactive)
              return [
                // Extended line without markers
                {
                  name: `${drawing.name} - ${index + 1} (line)`,
                  data: toHighchartsData([p1, p2]),
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
                  data: toHighchartsData(pointsWithTime),
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
                data: toHighchartsData(pointsWithTime),
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
              data: toHighchartsData(pointsWithTime),
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

            const start = extendMinTime;
            const end = extendMaxTime;
            
            return {
              name: drawing.name,
              data: [
                [start * 1000, yValue],
                [end * 1000, yValue]
              ],
              type: "line" as const,
              color,
              lineColor: color,
              marker: { enabled: false },
              lineWidth: 2,
              showInLegend: false,
              enableMouseTracking: false,
              // Critical: disable clipping so line extends beyond plot area
              clip: false,
              // Ensure line renders above other elements
              zIndex: 3,
              // Disable animation to prevent rendering issues
              animation: false,
              // Force line to be visible across entire chart
              cropThreshold: 0,
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
            data: toHighchartsData(pointsWithTime),
            type: "scatter" as const,
            color,
            marker: createMarker(color, 6, symbol),
            lineWidth: 0,
          } as Highcharts.SeriesScatterOptions;
      }
    })
  );
}

