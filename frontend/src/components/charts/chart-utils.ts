import type { Drawing } from "./chart-types";

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
  // Find the closest point instead of just the first match
  let closestPoint: { drawingId: string; seriesId: string; pointId: string; distance: number } | null = null;
  
  for (const d of drawings) {
    for (const s of d.series) {
      for (const p of s.points) {
        const dx = Math.abs(p.x - x);
        const dy = Math.abs(p.y - y);
        
        // Check if within tolerance
        if (dx < xTolerance && dy < yTolerance) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Keep track of closest point
          if (!closestPoint || distance < closestPoint.distance) {
            closestPoint = { drawingId: d.id, seriesId: s.id, pointId: p.id, distance };
          }
        }
      }
    }
  }
  
  if (closestPoint) {
    return { drawingId: closestPoint.drawingId, seriesId: closestPoint.seriesId, pointId: closestPoint.pointId };
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

/**
 * Calculate perpendicular distance from a point to a line
 */
export const calculatePerpendicularDistance = (
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
  point: { x: number; y: number }
): number => {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) return 0; // Prevent division by zero
  
  // Signed distance (positive = above/right, negative = below/left)
  return ((point.y - lineStart.y) * dx - (point.x - lineStart.x) * dy) / length;
};

/**
 * Calculate parallel line given base line and perpendicular distance
 */
export const calculateParallelLine = (
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number },
  distance: number
): [{ x: number; y: number }, { x: number; y: number }] => {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length === 0) {
    // If base line has no length, return same points
    return [lineStart, lineEnd];
  }
  
  // Calculate perpendicular unit vector
  const perpX = -dy / length;
  const perpY = dx / length;
  
  // Apply distance offset to both points
  const parallelStart = {
    x: lineStart.x + perpX * distance,
    y: lineStart.y + perpY * distance,
  };
  
  const parallelEnd = {
    x: lineEnd.x + perpX * distance,
    y: lineEnd.y + perpY * distance,
  };
  
  return [parallelStart, parallelEnd];
};

/**
 * Recalculates the dashed line and center point for a channel drawing based on boundary lines
 */
export const recalculateChannelCenterLine = (
  drawing: Drawing
): Drawing => {
  if (drawing.type !== 'channel') return drawing;
  
  const baseSeries = drawing.series[0];
  const parallelSeries = drawing.series[1];
  const dashedSeries = drawing.series[2];
  const centerSeries = drawing.series[3];
  
  // Need both boundary lines, dashed line, and center point to exist
  if (!baseSeries || !parallelSeries || !dashedSeries || !centerSeries) {
    return drawing;
  }
  
  if (baseSeries.points.length < 2 || parallelSeries.points.length < 2) {
    return drawing;
  }
  
  // Calculate new dashed line (midpoints between boundary lines)
  const dashedStart = {
    x: (baseSeries.points[0].x + parallelSeries.points[0].x) / 2,
    y: (baseSeries.points[0].y + parallelSeries.points[0].y) / 2,
  };
  const dashedEnd = {
    x: (baseSeries.points[1].x + parallelSeries.points[1].x) / 2,
    y: (baseSeries.points[1].y + parallelSeries.points[1].y) / 2,
  };
  
  const updatedDashedSeries = {
    ...dashedSeries,
    points: [
      {
        ...dashedSeries.points[0],
        ...dashedStart,
      },
      {
        ...dashedSeries.points[1],
        ...dashedEnd,
      },
    ],
  };
  
  // Calculate new center point (center of all 4 boundary points)
  const centerX = (baseSeries.points[0].x + baseSeries.points[1].x + parallelSeries.points[0].x + parallelSeries.points[1].x) / 4;
  const centerY = (baseSeries.points[0].y + baseSeries.points[1].y + parallelSeries.points[0].y + parallelSeries.points[1].y) / 4;
  
  const updatedCenterSeries = {
    ...centerSeries,
    points: [
      {
        ...centerSeries.points[0],
        x: centerX,
        y: centerY,
      },
    ],
  };
  
  return {
    ...drawing,
    series: [baseSeries, parallelSeries, updatedDashedSeries, updatedCenterSeries],
  };
};


