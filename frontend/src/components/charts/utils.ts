import type { Drawing } from "./types";

/**
 * Generate a random hex color
 */
export function getRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
 * Generate a random color with good contrast (avoid very dark/light colors)
 */
export function getRandomChartColor(): string {
  const hue = Math.random() * 360;
  const saturation = 70 + Math.random() * 30; // 70-100%
  const lightness = 40 + Math.random() * 20; // 40-60%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Updates a point's position in a drawing
 */
export const updatePointInDrawings = (
  drawings: Drawing[],
  drawingId: string,
  seriesId: string,
  pointId: string,
  x: number,
  y: number
): Drawing[] => {
  return drawings.map((d) =>
    d.id === drawingId
      ? {
          ...d,
          series: d.series.map((s) =>
            s.id === seriesId
              ? {
                  ...s,
                  points: s.points.map((p) =>
                    p.id === pointId ? { ...p, x, y } : p
                  ),
                }
              : s
          ),
        }
      : d
  );
};

/**
 * Finds a point by coordinates with tolerance
 */
export const findPointInDrawings = (
  drawings: Drawing[],
  x: number,
  y: number,
  xTolerance: number = 10,
  yTolerance: number = 10
): { drawingId: string; seriesId: string; pointId: string } | null => {
  for (const d of drawings) {
    for (const s of d.series) {
      const point = s.points.find(
        (p) => Math.abs(p.x - x) < xTolerance && Math.abs(p.y - y) < yTolerance
      );
      if (point) {
        return { drawingId: d.id, seriesId: s.id, pointId: point.id };
      }
    }
  }
  return null;
};

/**
 * Adds a point to an existing drawing
 */
export const addPointToDrawing = (
  drawings: Drawing[],
  drawingId: string,
  seriesId: string,
  point: { x: number; y: number }
): Drawing[] => {
  const pointId = `point_${Date.now()}_${Math.random()}`;
  return drawings.map((d) =>
    d.id === drawingId
      ? {
          ...d,
          series: d.series.map((s) =>
            s.id === seriesId
              ? { ...s, points: [...s.points, { id: pointId, ...point }] }
              : s
          ),
        }
      : d
  );
};

/**
 * Removes a point from a drawing
 */
export const removePointFromDrawing = (
  drawings: Drawing[],
  drawingId: string,
  seriesId: string,
  pointId: string
): Drawing[] => {
  return drawings.map((d) =>
    d.id === drawingId
      ? {
          ...d,
          series: d.series.map((s) =>
            s.id === seriesId
              ? { ...s, points: s.points.filter((p) => p.id !== pointId) }
              : s
          ),
        }
      : d
  );
};

/**
 * Removes a drawing by ID
 */
export const deleteDrawingById = (
  drawings: Drawing[],
  drawingId: string
): Drawing[] => {
  return drawings.filter((d) => d.id !== drawingId);
};

/**
 * Marks a drawing as complete
 */
export const completeDrawingById = (
  drawings: Drawing[],
  drawingId: string
): Drawing[] => {
  return drawings.map((d) =>
    d.id === drawingId
      ? { ...d, metadata: { ...d.metadata, isIncomplete: false } }
      : d
  );
};

/**
 * Gets incomplete drawing for active tool
 */
export const getIncompleteDrawing = (
  drawings: Drawing[],
  activeTool: string
): Drawing | undefined => {
  return drawings.find((d) => d.metadata?.isIncomplete && d.type === activeTool);
};
