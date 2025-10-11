import type { Drawing } from "./types";

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
  const { xValue, yValue, drawings, addDrawing, toolType } = params;

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
    }
  }
}

