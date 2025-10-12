import type { Drawing } from "./chart-types";
import {
  calculatePerpendicularDistance,
  calculateParallelLine,
} from "./chart-utils";

export interface ToolHandlerParams {
  xValue: number;
  yValue: number;
  drawings: Drawing[];
  selectedData: { drawingId: string; seriesId: string; pointId: string } | null;
  findPoints: (
    x: number,
    y: number,
    xTolerance?: number,
    yTolerance?: number
  ) => { drawingId: string; seriesId: string; pointId: string } | null;
  setSelectedData: (
    point: { drawingId: string; seriesId: string; pointId: string } | null
  ) => void;
  setSelectedDrawingId: (drawingId: string | null) => void;
  addDrawing: (drawing: Drawing) => void;
  addPointToDrawing: (
    drawingId: string,
    seriesId: string,
    point: { x: number; y: number }
  ) => void;
  completeDrawing: (drawingId: string) => void;
  updateDrawing?: (drawingId: string, updates: Partial<Drawing>) => void;
}

/**
 * Handles clicks when no drawing tool is active
 * Manages point selection and drawing selection
 */
export function handleNoneTool(params: ToolHandlerParams): void {
  const {
    xValue,
    yValue,
    selectedData,
    findPoints,
    setSelectedData,
    setSelectedDrawingId,
  } = params;

  if (!selectedData) {
    // Find and select series at the point
    const foundPoint = findPoints(xValue, yValue);
    if (foundPoint) {
      setSelectedData(foundPoint);
      setSelectedDrawingId(foundPoint.drawingId);
    } else {
      // Clicked on empty space - deselect drawing
      setSelectedDrawingId(null);
    }
  }
}

/**
 * Handles clicks for shape tools (dot, triangle, square, circle, diamond)
 * Creates a new drawing with a single point
 */
export function handleShapeTool(
  params: ToolHandlerParams & { toolType: string }
): void {
  const { xValue, yValue, drawings, addDrawing, setSelectedDrawingId, toolType } = params;

  const drawingNumber = drawings.length + 1;
  const newDrawing: Drawing = {
    id: `drawing_${Date.now()}_${Math.random()}`,
    name: `Point ${drawingNumber}`,
    type: toolType as any,
    color: "#4caf50", // Fixed green color
    series: [
      {
        id: `series_${Date.now()}_${Math.random()}`,
        points: [
          {
            id: `point_${Date.now()}_${Math.random()}`,
            x: xValue,
            y: yValue,
          },
        ],
      },
    ],
  };

  addDrawing(newDrawing);
  // Auto-select the newly created drawing
  setSelectedDrawingId(newDrawing.id);
}

/**
 * Handles clicks for line tool
 * Manages incomplete line state and completion
 */
export function handleLineTool(params: ToolHandlerParams): void {
  const {
    xValue,
    yValue,
    drawings,
    addDrawing,
    addPointToDrawing,
    completeDrawing,
    setSelectedDrawingId,
  } = params;

  // Find incomplete line drawing directly from current drawings state
  const incompleteDrawing = drawings.find(
    (d) => d.metadata?.isIncomplete && d.type === "line"
  );

  console.log("LINE CLICK:", {
    incompleteDrawing,
    allDrawings: drawings,
  });

  if (!incompleteDrawing) {
    // First click - create line with first point
    const drawingId = `drawing_${Date.now()}_${Math.random()}`;
    const seriesId = `series_${Date.now()}_${Math.random()}`;

    const newDrawing: Drawing = {
      id: drawingId,
      name: `Line ${drawings.filter((d) => d.type === "line").length + 1}`,
      type: "line" as const,
      color: "#4caf50", // Fixed green color
      series: [
        {
          id: seriesId,
          points: [
            {
              id: `point_${Date.now()}_${Math.random()}`,
              x: xValue,
              y: yValue,
            },
          ],
        },
      ],
      metadata: { isIncomplete: true, maxPoints: 2 },
    };

    console.log("CREATING LINE:", newDrawing);
    addDrawing(newDrawing);
    // Auto-select the newly created drawing
    setSelectedDrawingId(newDrawing.id);
  } else {
    // Add point to incomplete drawing
    console.log("ADDING POINT TO LINE:", incompleteDrawing.id);
    const seriesId = incompleteDrawing.series[0].id;
    addPointToDrawing(incompleteDrawing.id, seriesId, {
      x: xValue,
      y: yValue,
    });

    // Check if we've reached the max points for this drawing
    const currentPoints = incompleteDrawing.series[0].points.length + 1; // +1 for the point we just added
    const maxPoints = incompleteDrawing.metadata?.maxPoints || 2;

    if (currentPoints >= maxPoints) {
      console.log("COMPLETING LINE:", incompleteDrawing.id);
      completeDrawing(incompleteDrawing.id);
      // Keep the drawing selected after completion
      setSelectedDrawingId(incompleteDrawing.id);
    }
  }
}

/**
 * Handles clicks for channel tool
 * Manages incomplete channel state and completion
 */
export function handleChannelTool(params: ToolHandlerParams): void {
  const {
    xValue,
    yValue,
    drawings,
    addDrawing,
    addPointToDrawing,
    completeDrawing,
    setSelectedDrawingId,
    updateDrawing,
  } = params;

  // Find incomplete channel drawing
  const incompleteDrawing = drawings.find(
    (d) => d.metadata?.isIncomplete && d.type === "channel"
  );

  if (!incompleteDrawing) {
    // First click - create channel with first point
    const drawingId = `drawing_${Date.now()}_${Math.random()}`;
    const seriesId = `series_${Date.now()}_${Math.random()}`;

    const newDrawing: Drawing = {
      id: drawingId,
      name: `Channel ${drawings.filter((d) => d.type === "channel").length + 1}`,
      type: "channel" as const,
      color: "#4caf50",
      series: [
        {
          id: seriesId,
          points: [
            {
              id: `point_${Date.now()}_${Math.random()}`,
              x: xValue,
              y: yValue,
            },
          ],
        },
      ],
      metadata: { isIncomplete: true, maxPoints: 3 },
    };

    addDrawing(newDrawing);
    setSelectedDrawingId(newDrawing.id);
  } else {
    const baseSeries = incompleteDrawing.series[0];
    const currentPoints = baseSeries.points.length;

    if (currentPoints === 1) {
      // Second click - add second point to base line
      addPointToDrawing(incompleteDrawing.id, baseSeries.id, {
        x: xValue,
        y: yValue,
      });
    } else if (currentPoints === 2) {
      // Third click - calculate parallel line and complete
      const [p1, p2] = baseSeries.points;
      const offsetPoint = { x: xValue, y: yValue };
      
      // Calculate perpendicular distance
      const distance = calculatePerpendicularDistance(p1, p2, offsetPoint);
      
      // Calculate parallel line (ONLY for initial creation)
      const [parallelStart, parallelEnd] = calculateParallelLine(p1, p2, distance);
      
      // Create the parallel series with independent points
      const parallelSeriesId = `series_${Date.now()}_${Math.random()}`;
      const parallelSeries = {
        id: parallelSeriesId,
        points: [
          {
            id: `point_${Date.now()}_${Math.random()}`,
            ...parallelStart,
          },
          {
            id: `point_${Date.now()}_1_${Math.random()}`,
            ...parallelEnd,
          },
        ],
      };
      
      // Update the drawing with parallel series
      // Note: Points are now independent - no recalculation on edit
      // Create a fresh copy of baseSeries to avoid reference issues
      if (updateDrawing) {
        // Calculate dashed line (midpoints between the two boundary lines)
        const dashedStart = {
          x: (baseSeries.points[0].x + parallelStart.x) / 2,
          y: (baseSeries.points[0].y + parallelStart.y) / 2,
        };
        const dashedEnd = {
          x: (baseSeries.points[1].x + parallelEnd.x) / 2,
          y: (baseSeries.points[1].y + parallelEnd.y) / 2,
        };
        
        // Create dashed line series
        const dashedSeriesId = `series_${Date.now()}_2_${Math.random()}`;
        const dashedSeries = {
          id: dashedSeriesId,
          points: [
            {
              id: `point_${Date.now()}_dashed_${Math.random()}`,
              ...dashedStart,
            },
            {
              id: `point_${Date.now()}_dashed_1_${Math.random()}`,
              ...dashedEnd,
            },
          ],
        };
        
        // Calculate center point (center of all 4 boundary points)
        const centerX = (baseSeries.points[0].x + baseSeries.points[1].x + parallelStart.x + parallelEnd.x) / 4;
        const centerY = (baseSeries.points[0].y + baseSeries.points[1].y + parallelStart.y + parallelEnd.y) / 4;
        
        // Create center point series (just ONE point in the middle)
        const centerSeriesId = `series_${Date.now()}_3_${Math.random()}`;
        const centerSeries = {
          id: centerSeriesId,
          points: [
            {
              id: `point_${Date.now()}_center_${Math.random()}`,
              x: centerX,
              y: centerY,
            },
          ],
        };
        
        const finalSeries = [
          { ...baseSeries, points: [...baseSeries.points] },
          parallelSeries,
          dashedSeries,
          centerSeries
        ];
        
        updateDrawing(incompleteDrawing.id, {
          series: finalSeries,
          metadata: {
            isIncomplete: false,
            dashedSeriesId, // Store the dashed line series ID
            centerSeriesId, // Store this so we know which series is the center point
          },
        });
      }
      
      completeDrawing(incompleteDrawing.id);
      setSelectedDrawingId(incompleteDrawing.id);
    }
  }
}

