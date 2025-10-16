import type { Drawing } from "./chart-types";
import { extendLineToRange } from "./chart-utils";

/**
 * Creates a marker configuration object for ECharts
 */
function createMarker(
  color: string,
  size: number,
  symbol?: string
) {
  return {
    symbol: symbol || 'circle',
    symbolSize: size,
    itemStyle: {
      color: color,
      borderColor: '#fff',
      borderWidth: 2,
    },
  };
}

/**
 * Renders drawings as ECharts series
 * Handles different drawing types: lines, dots, and shapes
 */
export function renderDrawingSeries(
  drawings: Drawing[],
  chartDataLength: number = 0,
  yMin: number = -Infinity,
  yMax: number = Infinity
): any[] {
  return drawings.flatMap((drawing) =>
    drawing.series.flatMap((s, index) => {
      const color = drawing.color || "#000000"; // Default to black for all drawings

      switch (drawing.type) {
        case "line":
          // Complete line with 2+ points - render as line
          if (s.points.length >= 2) {
            return [
              {
                type: 'line',
                name: `${drawing.name} - ${index + 1}`,
                data: s.points.map((p) => [p.x, p.y]),
                lineStyle: {
                  color,
                  width: 2,
                },
                symbol: 'circle',
                symbolSize: 8,
                itemStyle: {
                  color,
                  borderColor: '#fff',
                  borderWidth: 2,
                },
                showSymbol: true,
                emphasis: {
                  disabled: true,
                },
              }
            ];
          } else {
            // Incomplete line - render first point as scatter
            return [
              {
                type: 'scatter',
                name: `${drawing.name} - ${index + 1}`,
                data: s.points.map((p) => [p.x, p.y]),
                ...createMarker(color, 8, 'circle'),
              }
            ];
          }

        case "channel":
          // Check if this is the center point (4th series with 1 point)
          const isCenterPoint = drawing.metadata?.centerSeriesId === s.id;
          // Check if this is the dashed line (3rd series)
          const isDashedLine = drawing.metadata?.dashedSeriesId === s.id;
          
          if (isCenterPoint) {
            // Render center point as a single draggable dot
            return [
              {
                type: 'scatter',
                name: `${drawing.name} - center`,
                data: s.points.map((p) => [p.x, p.y]),
                ...createMarker("#000000", 8, 'circle'),
              }
            ];
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
            return [
              {
                type: 'line',
                name: `${drawing.name} - dashed`,
                data: lineData,
                lineStyle: {
                  color: "#888888",
                  width: 1,
                  type: 'dashed',
                },
                symbol: 'none',
                showSymbol: false,
                emphasis: {
                  disabled: true,
                },
                silent: true,
              }
            ];
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
                  type: 'line',
                  name: `${drawing.name} - ${index + 1} (line)`,
                  data: [[p1.x, p1.y], [p2.x, p2.y]],
                  lineStyle: {
                    color,
                    width: 2,
                  },
                  symbol: 'none',
                  showSymbol: false,
                  emphasis: {
                    disabled: true,
                  },
                  silent: true,
                },
                // Control points with markers (interactive)
                {
                  type: 'scatter',
                  name: `${drawing.name} - ${index + 1} (points)`,
                  data: s.points.map((p) => [p.x, p.y]),
                  ...createMarker(color, 8, 'circle'),
                }
              ];
            } else {
              // Incomplete parallel line (not base line) - render normal line
              return [
                {
                  type: 'line',
                  name: `${drawing.name} - ${index + 1}`,
                  data: s.points.map((p) => [p.x, p.y]),
                  lineStyle: {
                    color,
                    width: 2,
                  },
                  symbol: 'circle',
                  symbolSize: 8,
                  itemStyle: {
                    color,
                    borderColor: '#fff',
                    borderWidth: 2,
                  },
                  showSymbol: true,
                  emphasis: {
                    disabled: true,
                  },
                }
              ];
            }
          } else {
            // Incomplete channel - render first point as scatter
            return [
              {
                type: 'scatter',
                name: `${drawing.name} - ${index + 1}`,
                data: s.points.map((p) => [p.x, p.y]),
                ...createMarker(color, 8, 'circle'),
              }
            ];
          }

        case "hline":
          // Horizontal line - extends across entire chart at a fixed y-value
          if (s.points.length >= 1) {
            const yValue = s.points[0].y;
            
            return [
              // Extended horizontal line
              {
                type: 'line',
                name: drawing.name,
                data: [[0, yValue], [chartDataLength - 1, yValue]],
                lineStyle: {
                  color,
                  width: 2,
                },
                symbol: 'none',
                showSymbol: false,
                emphasis: {
                  disabled: true,
                },
                silent: true,
              },
              // Single control point in the middle for dragging
              {
                type: 'scatter',
                name: `${drawing.name} - control`,
                data: [[(chartDataLength - 1) / 2, yValue]],
                ...createMarker(color, 8, 'circle'),
              }
            ];
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
          return [
            {
              type: 'scatter',
              name: `${drawing.name} - ${index + 1}`,
              data: s.points.map((p) => [p.x, p.y]),
              ...createMarker(color, 12, symbol),
            }
          ];
      }
    })
  );
}
