# Drawings/Series API Documentation

The Drawings API allows you to save and manage chart drawings (lines, channels, horizontal lines, etc.) for each trading pair. Data is stored temporarily in a JSON file at `backend/app/data/drawings.json`.

## API Endpoints

### Get All Drawings

```http
GET /api/v1/drawings/
```

**Query Parameters:**
- `pair` (optional): Filter by trading pair (e.g., "EURUSD")

**Response:**
```json
{
  "drawings": [
    {
      "id": "drawing-123",
      "name": "Support Line",
      "type": "line",
      "color": "#00ff00",
      "pair": "EURUSD",
      "series": [
        {
          "id": "series-1",
          "points": [
            { "id": "point-1", "x": 100, "y": 1.0875 },
            { "id": "point-2", "x": 200, "y": 1.0900 }
          ]
        }
      ],
      "metadata": {
        "isIncomplete": false
      }
    }
  ],
  "count": 1
}
```

### Get Single Drawing

```http
GET /api/v1/drawings/{drawing_id}
```

**Response:** Single drawing object

### Create Drawing

```http
POST /api/v1/drawings/
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": "drawing-456",
  "name": "Resistance Line",
  "type": "hline",
  "color": "#ff0000",
  "pair": "EURUSD",
  "series": [
    {
      "id": "series-1",
      "points": [
        { "id": "point-1", "x": 0, "y": 1.1000 }
      ]
    }
  ],
  "metadata": {
    "description": "Strong resistance level"
  }
}
```

**Response:** Created drawing object (201 Created)

### Update Drawing

```http
PUT /api/v1/drawings/{drawing_id}
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "name": "Updated Support Line",
  "color": "#0000ff",
  "series": [...],
  "metadata": {...}
}
```

**Response:** Updated drawing object

### Delete Single Drawing

```http
DELETE /api/v1/drawings/{drawing_id}
```

**Response:**
```json
{
  "message": "Drawing drawing-456 deleted successfully"
}
```

### Delete All Drawings

```http
DELETE /api/v1/drawings/
```

**Query Parameters:**
- `pair` (optional): Delete only drawings for specific pair

**Response:**
```json
{
  "message": "Deleted 5 drawing(s)",
  "deleted_count": 5
}
```

## Frontend Integration Example

### Load Drawings on Chart Mount

```typescript
import { apiClient } from '@/lib/api-client';
import { useEffect } from 'react';

function ChartComponent({ pair }: { pair: string }) {
  useEffect(() => {
    // Load saved drawings for this pair
    apiClient.getDrawings(pair)
      .then(response => {
        // Set drawings in your chart context
        response.drawings.forEach(drawing => {
          // Convert API drawing to chart drawing format if needed
          addDrawing(drawing);
        });
      })
      .catch(err => console.error('Error loading drawings:', err));
  }, [pair]);
  
  // ... rest of component
}
```

### Save Drawing After Creation

```typescript
import { apiClient } from '@/lib/api-client';

async function handleDrawingComplete(drawing: Drawing) {
  try {
    await apiClient.createDrawing({
      ...drawing,
      pair: currentPair, // e.g., "EURUSD"
    });
    console.log('Drawing saved successfully');
  } catch (error) {
    console.error('Error saving drawing:', error);
  }
}
```

### Update Drawing After Modification

```typescript
async function handleDrawingUpdate(drawingId: string, updates: Partial<Drawing>) {
  try {
    await apiClient.updateDrawing(drawingId, updates);
    console.log('Drawing updated successfully');
  } catch (error) {
    console.error('Error updating drawing:', error);
  }
}
```

### Delete Drawing

```typescript
async function handleDeleteDrawing(drawingId: string) {
  try {
    await apiClient.deleteDrawing(drawingId);
    console.log('Drawing deleted successfully');
  } catch (error) {
    console.error('Error deleting drawing:', error);
  }
}
```

### Clear All Drawings for Pair

```typescript
async function handleClearAllDrawings(pair: string) {
  try {
    const result = await apiClient.deleteAllDrawings(pair);
    console.log(result.message); // "Deleted X drawing(s) for pair EURUSD"
  } catch (error) {
    console.error('Error clearing drawings:', error);
  }
}
```

## Drawing Types

Supported drawing types (from your chart):
- `dot` - Single point marker
- `line` - Line between two points
- `trendline` - Trend line
- `channel` - Parallel channel lines
- `hline` - Horizontal line
- `rectangle` - Rectangle shape
- `fibonacci` - Fibonacci retracement
- `triangle` - Triangle shape
- `circle` - Circle shape
- `diamond` - Diamond shape
- `square` - Square shape

## Data Storage

Drawings are stored in: `backend/app/data/drawings.json`

The file is automatically created on first use and persists between server restarts.

## Future Enhancements

- [ ] Move from JSON file to database (PostgreSQL)
- [ ] Add user authentication and ownership
- [ ] Add versioning/history for drawings
- [ ] Add sharing capabilities
- [ ] Add templates/presets
- [ ] Add drawing groups/folders

