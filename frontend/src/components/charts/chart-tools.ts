import type { Drawing, DataPoint } from "./chart-types";
import {
  calculatePerpendicularDistance,
  calculateParallelLine,
} from "./chart-utils";

export interface ToolHandlerParams {
  timestamp: number;  // Changed: Now stores timestamp instead of index
  yValue: number;
  chartData: DataPoint[];  // Added: Need chartData for timestamp operations
  drawings: Drawing[];
  selectedData: { drawingId: number | null; seriesId: number | null; pointId: number | null } | null;
  findPoints: (
    x: number,
    y: number,
    xTolerance?: number,
    yTolerance?: number
  ) => { drawingId: number | null; seriesId: number | null; pointId: number | null } | null;
  setSelectedData: (
    point: { drawingId: number | null; seriesId: number | null; pointId: number | null } | null
  ) => void;
  setSelectedDrawingId: (drawingId: number | null) => void;
  addDrawing: (drawing: Drawing) => void;
  addPointToDrawing: (
    drawingId: number | null,
    seriesId: number | null,
    point: { x: number; y: number }
  ) => void;
  completeDrawing: (drawingId: number | null) => void;
  updateDrawing?: (drawingId: number | null, updates: Partial<Drawing>) => void;
}

/**
 * Handles clicks when no drawing tool is active
 * Manages point selection and drawing selection
 */
export function handleNoneTool(params: ToolHandlerParams): void {
  const {
    timestamp,  // Changed: Use timestamp instead of xValue
    yValue,
    selectedData,
    findPoints,
    setSelectedData,
    setSelectedDrawingId,
  } = params;

  if (!selectedData) {
    // Find and select series at the point
    const foundPoint = findPoints(timestamp, yValue);  // Changed: Pass timestamp
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
  const { timestamp, yValue, drawings, addDrawing, setSelectedDrawingId, toolType } = params;  // Changed: Use timestamp

  const drawingNumber = drawings.length + 1;
  const newDrawing: Drawing = {
    id: null,
    name: `Point ${drawingNumber}`,
    type: toolType as any,
    style: { color: "#000000" },
    series: [
      {
        id: null,
        style: { color: "#000000" },
        points: [
          {
            id: null,
            x: timestamp,  // Changed: Store timestamp in x
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
    timestamp,  // Changed: Use timestamp instead of xValue
    yValue,
    drawings,
    addDrawing,
    addPointToDrawing,
    completeDrawing,
    setSelectedDrawingId,
  } = params;

  // Find incomplete line drawing directly from current drawings state
  const incompleteDrawing = drawings.find(
    (d) => d.type === "line" && d.isIncomplete
  );


  if (!incompleteDrawing) {
    // First click - create line with first point
    const newDrawing: Drawing = {
      id: null,
      name: `Line ${drawings.filter((d) => d.type === "line").length + 1}`,
      type: "line" as const,
      style: { color: "#000000" },
      series: [
        {
          id: null,
          name: "tline",
          style: { maxPoints: 2, color: "#000000" },
          points: [
            {
              id: null,
              x: timestamp,  // Changed: Store timestamp in x
              y: yValue,
            },
          ],
        },
      ],
      isIncomplete: true,
    };

    addDrawing(newDrawing);
    // Auto-select the newly created drawing
    setSelectedDrawingId(newDrawing.id);
  } else {
    // Add point to incomplete drawing
    const seriesId = incompleteDrawing.series[0].id;
    addPointToDrawing(incompleteDrawing.id, seriesId, {
      x: timestamp,  // Changed: Store timestamp in x
      y: yValue,
    });

    // Check if we've reached the max points for this drawing
    const currentPoints = incompleteDrawing.series[0].points.length + 1; // +1 for the point we just added
    const maxPoints = incompleteDrawing.series[0]?.style?.maxPoints || 2;

    if (currentPoints >= maxPoints) {
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
    timestamp,  // Changed: Use timestamp instead of xValue
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
    (d) => d.type === "channel" && d.isIncomplete
  );

  if (!incompleteDrawing) {
    // First click - create channel with first point
    const newDrawing: Drawing = {
      id: null,
      name: `Channel ${drawings.filter((d) => d.type === "channel").length + 1}`,
      type: "channel" as const,
      style: { color: "#000000" },
      series: [
        {
          id: null,
          name: "tline",
          style: { maxPoints: 3, color: "#000000" },
          points: [
            {
              id: null,
              x: timestamp,  // Changed: Store timestamp in x
              y: yValue,
            },
          ],
        },
      ],
      isIncomplete: true,
    };

    addDrawing(newDrawing);
    setSelectedDrawingId(newDrawing.id);
  } else {
    const baseSeries = incompleteDrawing.series[0];
    const currentPoints = baseSeries.points.length;

    if (currentPoints === 1) {
      // Second click - add second point to base line
      addPointToDrawing(incompleteDrawing.id, baseSeries.id, {
        x: timestamp,  // Changed: Store timestamp in x
        y: yValue,
      });
    } else if (currentPoints === 2) {
      // Third click - calculate parallel line and complete
      const [p1, p2] = baseSeries.points;
      const offsetPoint = { x: timestamp, y: yValue };  // Changed: Use timestamp
      
      // Calculate perpendicular distance
      const distance = calculatePerpendicularDistance(p1, p2, offsetPoint);
      
      // Calculate parallel line (ONLY for initial creation)
      const [parallelStart, parallelEnd] = calculateParallelLine(p1, p2, distance);
      
      // Create the parallel series with independent points
      const parallelSeries = {
        id: null,
        name: "tline2",
        style: { color: "#000000" },
        points: [
          {
            id: null,
            ...parallelStart,
          },
          {
            id: null,
            ...parallelEnd,
          },
        ],
      };
      
      // Build dashed center line (between the two boundary lines)
      const dashedStart = {
        x: (baseSeries.points[0].x + parallelStart.x) / 2,
        y: (baseSeries.points[0].y + parallelStart.y) / 2,
      };
      const dashedEnd = {
        x: (baseSeries.points[1].x + parallelEnd.x) / 2,
        y: (baseSeries.points[1].y + parallelEnd.y) / 2,
      };

      const dashedSeries = {
        id: null,
        name: "tlinemid",
        style: { color: "#888888" },
        points: [
          { id: null, ...dashedStart },
          { id: null, ...dashedEnd },
        ],
      };

      // Single center point for vertical drag of the whole channel
      const centerX = (baseSeries.points[0].x + baseSeries.points[1].x + parallelStart.x + parallelEnd.x) / 4;
      const centerY = (baseSeries.points[0].y + baseSeries.points[1].y + parallelStart.y + parallelEnd.y) / 4;
      const centerSeries = {
        id: null,
        name: "tlinecenter",
        style: { color: "#000000" },
        points: [{ id: null, x: centerX, y: centerY }],
      };

      // Assign temporary local ids so renderer/updates can identify series
      const baseId = baseSeries.id ?? 1;
      const parallelId = 2;
      const dashedId = 3;
      const centerId = 4;

      const finalSeries = [
        { ...baseSeries, id: baseId, points: [...baseSeries.points] },
        { ...parallelSeries, id: parallelId },
        { ...dashedSeries, id: dashedId },
        { ...centerSeries, id: centerId },
      ];

      if (updateDrawing) {
        updateDrawing(incompleteDrawing.id, {
          series: finalSeries,
          isIncomplete: false,
        });
      }

      completeDrawing(incompleteDrawing.id);
      setSelectedDrawingId(incompleteDrawing.id);
    }
  }
}

/**
 * Handles clicks for horizontal line tool
 * Creates a horizontal line at the clicked y-value
 */
export function handleHLineTool(params: ToolHandlerParams): void {
  const {
    timestamp,  // Changed: Get timestamp (though hline doesn't really use it)
    yValue,
    drawings,
    addDrawing,
    setSelectedDrawingId,
  } = params;

  const drawingNumber = drawings.filter((d) => d.type === "hline").length + 1;

  const newDrawing: Drawing = {
    id: null,
    name: `H-Line ${drawingNumber}`,
    type: "hline" as const,
    style: { color: "#000000" },
    series: [
      {
        id: null,
        name: "hline",
        style: { color: "#000000" },
        points: [
          {
            id: null,
            x: timestamp, // Store timestamp (though hline extends across chart regardless)
            y: yValue,
          },
        ],
      },
    ],
    isIncomplete: false,
  };

  addDrawing(newDrawing);
  setSelectedDrawingId(newDrawing.id);
}

