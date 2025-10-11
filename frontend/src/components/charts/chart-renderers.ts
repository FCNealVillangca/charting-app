import Highcharts from "highcharts";
import type { Drawing } from "./types";

/**
 * Gets the marker symbol for a given drawing type
 */
function getMarkerSymbol(drawingType: string): string {
  switch (drawingType) {
    case "triangle":
      return "triangle";
    case "square":
      return "square";
    case "circle":
      return "circle";
    case "diamond":
      return "diamond";
    default:
      return "circle"; // Default to circle for dot
  }
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
      switch (drawing.type) {
        case "line":
          // For lines, only render if we have at least 2 points OR if it's incomplete with 1 point (show as scatter)
          if (s.points.length >= 2) {
            // Complete line - render as line
            return {
              type: "line" as const,
              name: `${drawing.name} - ${index + 1}`,
              data: s.points.map((p) => [p.x, p.y]),
              color: drawing.color || "#ff6b35",
              marker: {
                radius: 4,
                fillColor: drawing.color || "#ff6b35",
                lineColor: "#fff",
                lineWidth: 2,
                states: {
                  hover: {
                    enabled: false,
                  },
                },
              },
              lineWidth: 2,
              showInLegend: false,
              enableMouseTracking: true,
            } as Highcharts.SeriesLineOptions;
          } else {
            // Incomplete line - render first point as scatter
            return {
              type: "scatter" as const,
              name: `${drawing.name} - ${index + 1}`,
              data: s.points.map((p) => [p.x, p.y]),
              color: drawing.color || "#ff6b35",
              marker: {
                radius: 4,
                fillColor: drawing.color || "#ff6b35",
                lineColor: "#fff",
                lineWidth: 2,
                states: {
                  hover: {
                    enabled: false,
                  },
                },
              },
              lineWidth: 0,
              showInLegend: false,
              enableMouseTracking: true,
            } as Highcharts.SeriesScatterOptions;
          }

        case "dot":
        case "triangle":
        case "square":
        case "circle":
        case "diamond":
        default:
          // Shape drawing types
          return {
            type: "scatter" as const,
            name: `${drawing.name} - ${index + 1}`,
            data: s.points.map((p) => [p.x, p.y]),
            color: drawing.color || "#4caf50",
            marker: {
              radius: 6,
              symbol: getMarkerSymbol(drawing.type),
              fillColor: drawing.color || "#4caf50",
              lineColor: "#fff",
              lineWidth: 2,
              states: {
                hover: {
                  enabled: false,
                },
              },
            },
            lineWidth: 0,
            showInLegend: false,
            enableMouseTracking: true,
          } as Highcharts.SeriesScatterOptions;
      }
    })
  );
}

