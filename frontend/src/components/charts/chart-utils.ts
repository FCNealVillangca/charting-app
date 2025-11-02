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
  drawingId: number | null,
  seriesId: number | null,
  pointId: number | null,
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
): { drawingId: number | null; seriesId: number | null; pointId: number | null } | null => {
  // Find the closest point instead of just the first match
  let closestPoint: { drawingId: number | null; seriesId: number | null; pointId: number | null; distance: number } | null = null;
  
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
 * Enhanced finder - checks Y-axis first for lines, then checks both axes for points
 */
export const findLineOrPoint = (
  drawings: Drawing[],
  x: number,
  y: number,
  xTolerance: number = 10,
  yTolerance: number = 10
): { drawingId: number | null; seriesId: number | null; pointId: number | null } | null => {
  
  // 1. Check Y-axis ONLY for horizontal lines (hline)
  let closestHLineOnYAxis: { drawingId: number | null; seriesId: number | null; pointId: number | null; distance: number } | null = null;
  
  for (const d of drawings) {
    for (const s of d.series) {
      // Check if ANY point in this series is near the Y value
      for (const p of s.points) {
        const distanceY = Math.abs(p.y - y);

        // Only consider horizontal lines, and use provided yTolerance
        if (d.type === 'hline' && distanceY < yTolerance) {
          if (!closestHLineOnYAxis || distanceY < closestHLineOnYAxis.distance) {
            closestHLineOnYAxis = {
              drawingId: d.id,
              seriesId: s.id,
              pointId: p.id,
              distance: distanceY
            };
          }
        }
      }
    }
  }
  
  // If we found a horizontal line on Y-axis, return it
  if (closestHLineOnYAxis) {
    return { 
      drawingId: closestHLineOnYAxis.drawingId, 
      seriesId: closestHLineOnYAxis.seriesId, 
      pointId: closestHLineOnYAxis.pointId 
    };
  }
  
  // 2. Otherwise, check both X and Y axes for points (standard point detection)
  return findPointInDrawings(drawings, x, y, xTolerance, yTolerance);
};

/**
 * Adds a point to an existing drawing
 */
export const addPointToDrawing = (
  drawings: Drawing[],
  drawingId: number | null,
  seriesId: number | null,
  point: { x: number; y: number }
): Drawing[] => {
  return drawings.map((d) =>
    d.id === drawingId
      ? {
          ...d,
          series: d.series.map((s) =>
            s.id === seriesId
              ? { ...s, points: [...s.points, { id: null, ...point }] }
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
  drawingId: number | null,
  seriesId: number | null,
  pointId: number | null
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
  drawingId: number | null
): Drawing[] => {
  return drawings.filter((d) => d.id !== drawingId);
};

/**
 * Marks a drawing as complete
 */
export const completeDrawingById = (
  drawings: Drawing[],
  drawingId: number | null
): Drawing[] => {
  return drawings.map((d) =>
    d.id === drawingId
      ? { ...d, isIncomplete: false }
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
  return drawings.find((d) => d.type === activeTool && d.isIncomplete);
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
 * Extends a line defined by two points to the chart boundaries
 * Clamps y-values to prevent infinity on vertical lines
 */
export const extendLineToRange = (
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  minX: number,
  maxX: number,
  minY: number,
  maxY: number
): [{ x: number; y: number }, { x: number; y: number }] => {
  // Handle vertical lines (infinite slope)
  if (p2.x === p1.x) {
    // Vertical line - extend to y boundaries, keep x constant
    const x = p1.x;
    return [
      { x, y: minY },
      { x, y: maxY }
    ];
  }
  
  // Calculate slope and intercept
  const m = (p2.y - p1.y) / (p2.x - p1.x);
  const b = p1.y - m * p1.x;
  
  // Calculate y-values at the x boundaries without clamping.
  // Returning unclamped values preserves the exact slope so the
  // extended line passes through the original anchor points.
  const y1 = m * minX + b;
  const y2 = m * maxX + b;
  
  return [
    { x: minX, y: y1 },
    { x: maxX, y: y2 }
  ];
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


