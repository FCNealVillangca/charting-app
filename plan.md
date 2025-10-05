# Refactor Chart Utils and Extract Config

## File Organization - ALL Functions Go in utils.ts

Everything goes into `frontend/src/components/charts/utils.ts` organized by category:

```typescript
// utils.ts structure - COMPLETE LIST OF ALL FUNCTIONS:

// ===== EXISTING FUNCTIONS (already there) =====
// Color utilities
export function getRandomColor()
export function getRandomChartColor()

// Drawing mutations (already there)
export const updatePointInDrawings
export const addPointToDrawing  
export const removePointFromDrawing
export const deleteDrawingById
export const completeDrawingById
export const findPointInDrawings
export const getIncompleteDrawing

// ===== NEW FUNCTIONS TO ADD =====

// 1. ID Generation
export function generateId(prefix: string)
export function generateDrawingName(type: string, existingDrawings: Drawing[])

// 2. Drawing Factory Functions (all make* drawing functions)
export function makeDotDrawing(x: number, y: number, existingDrawings: Drawing[])
export function makeLineDrawing(x: number, y: number, existingDrawings: Drawing[], isIncomplete?: boolean)
export function makeTriangleDrawing(x: number, y: number, existingDrawings: Drawing[])
export function makeInvTriangleDrawing(x: number, y: number, existingDrawings: Drawing[])
export function makeTrendlineDrawing(x: number, y: number, existingDrawings: Drawing[])
export function makeFibonacciDrawing(x: number, y: number, existingDrawings: Drawing[])
export function makeChannelDrawing(x: number, y: number, existingDrawings: Drawing[])
export function makeRectangleDrawing(x: number, y: number, existingDrawings: Drawing[])

// 3. Series Rendering Functions (all make*Series functions)
export function makeDotSeries(drawing: Drawing, seriesIndex: number, series: Series)
export function makeLineSeries(drawing: Drawing, seriesIndex: number, series: Series)
export function makeIncompleteLineSeries(drawing: Drawing, seriesIndex: number, series: Series)
export function makeTriangleSeries(drawing: Drawing, seriesIndex: number, series: Series)
export function makeInvTriangleSeries(drawing: Drawing, seriesIndex: number, series: Series)
export function makeTrendlineSeries(drawing: Drawing, seriesIndex: number, series: Series)
export function makeFibonacciSeries(drawing: Drawing, seriesIndex: number, series: Series)
export function makeChannelSeries(drawing: Drawing, seriesIndex: number, series: Series)
export function makeRectangleSeries(drawing: Drawing, seriesIndex: number, series: Series)
export function drawingToSeries(drawing: Drawing)
export function convertDrawingsToSeries(drawings: Drawing[])

// 4. Highcharts Configuration Builders (all make*Options functions)
export function makeChartOptions(selectedData: any, activeTool: string)
export function makeXAxisOptions(chartData: DataPoint[])
export function makeYAxisOptions()
export function makePlotOptions()
export function makeBaseChartOptions(highchartsData: any[], drawings: Drawing[], chartData: DataPoint[], selectedData: any, activeTool: string)

// 5. Data Transformation
export function sanitizeChartData(data: DataPoint[])
export function convertToHighchartsData(chartData: DataPoint[])

// 6. Additional Update Functions
export function updateDrawingColor(drawings: Drawing[], drawingId: string, color: string)
export function updateDrawingName(drawings: Drawing[], drawingId: string, name: string)
export function updateDrawingMetadata(drawings: Drawing[], drawingId: string, metadata: any)
```

## Extract to utils.ts

### 1. Highcharts Configuration Builders

Extract the massive Highcharts options object into modular builder functions:

- `makeChartOptions(selectedData, activeTool)` - chart config (lines 93-104)
- `makeXAxisOptions(chartData)` - x-axis with formatter (lines 109-132)
- `makeYAxisOptions()` - y-axis config (lines 133-147)
- `makePlotOptions()` - candlestick and series options (lines 235-254)
- `makeBaseChartOptions(highchartsData, drawings, chartData, selectedData, activeTool)` - combines all above

### 2. Series Rendering Functions

Convert Drawing objects to Highcharts series options:

- `makeDotSeries(drawing, seriesIndex, series)` - renders dots as scatter points (lines 211-230)
- `makeLineSeries(drawing, seriesIndex, series)` - renders complete lines (lines 166-185)
- `makeIncompleteLineSeries(drawing, seriesIndex, series)` - renders incomplete lines as dots (lines 188-207)
- `makeTriangleSeries(drawing, seriesIndex, series)` - future: upward triangles
- `makeInvTriangleSeries(drawing, seriesIndex, series)` - future: downward triangles
- `makeTrendlineSeries(drawing, seriesIndex, series)` - future: extended trendlines
- `makeFibonacciSeries(drawing, seriesIndex, series)` - future: fibonacci levels
- `makeChannelSeries(drawing, seriesIndex, series)` - future: parallel channels
- `makeRectangleSeries(drawing, seriesIndex, series)` - future: rectangles/boxes
- `drawingToSeries(drawing)` - main router that calls appropriate renderer based on drawing.type (lines 160-233)
- `convertDrawingsToSeries(drawings)` - converts all drawings to Highcharts series array

### 3. Drawing Factory Functions

Create factory functions for drawing objects:

- `makeDotDrawing(x, y, existingDrawings)` - creates dot drawing (lines 461-478)
- `makeLineDrawing(x, y, existingDrawings, isIncomplete?)` - creates line drawing (lines 500-520)
- `makeTrendlineDrawing(x, y, existingDrawings)` - future trendline support
- `makeFibonacciDrawing(x, y, existingDrawings)` - future fibonacci retracement
- `makeChannelDrawing(x, y, existingDrawings)` - future channel/parallel lines
- `makeRectangleDrawing(x, y, existingDrawings)` - future rectangle tool

### 4. ID Generation Utilities

- `generateId(prefix)` - replaces `${prefix}_${Date.now()}_${Math.random()}`
- `generateDrawingName(type, existingDrawings)` - generates names like "Point 1", "Line 2"

### 5. Drawing Update/Mutation Functions

Already exist in utils.ts but should be organized together:

- `updatePointInDrawings(drawings, drawingId, seriesId, pointId, x, y)` - updates point position (EXISTING)
- `addPointToDrawing(drawings, drawingId, seriesId, point)` - adds point to drawing (EXISTING)
- `removePointFromDrawing(drawings, drawingId, seriesId, pointId)` - removes point (EXISTING)
- `deleteDrawingById(drawings, drawingId)` - deletes entire drawing (EXISTING)
- `completeDrawingById(drawings, drawingId)` - marks drawing complete (EXISTING)
- `updateDrawingColor(drawings, drawingId, color)` - NEW: update drawing color
- `updateDrawingName(drawings, drawingId, name)` - NEW: rename drawing
- `updateDrawingMetadata(drawings, drawingId, metadata)` - NEW: update metadata

### 6. Data Transformation Utilities

- `sanitizeChartData(data)` - deduplicates and validates data (lines 61-77)
- `convertToHighchartsData(chartData)` - transforms to candlestick format (lines 79-88)

## Update chart.tsx

Replace inline logic with imported utility functions:

- Replace lines 90-280 with `makeBaseChartOptions()` call
- Replace lines 160-233 with `convertDrawingsToSeries()` call
- Replace lines 461-478 with `makeDotDrawing()` call
- Replace lines 500-520 with `makeLineDrawing()` call
- Replace lines 61-88 with `sanitizeChartData()` and `convertToHighchartsData()` calls

Expected result: chart.tsx reduced from 738 lines to ~400 lines, with all reusable logic in utils.ts

## To-dos

- [ ] Create Highcharts configuration builder functions in utils.ts
- [ ] Create series rendering functions to convert Drawing objects to Highcharts series
- [ ] Create factory functions for all drawing types (dot, line, trendline, fibonacci, channel, rectangle)
- [ ] Create ID and name generation utility functions
- [ ] Extract data sanitization and transformation utilities
- [ ] Refactor chart.tsx to use all the new utility functions
