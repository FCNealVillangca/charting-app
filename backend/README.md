# Trading Chart Backend API

FastAPI backend for serving trading chart data with cursor-based pagination and drawings/series management.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Server

**Simple way (recommended for development):**
```bash
cd backend
python run.py
```

**Alternative (more control):**
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`

## API Endpoints

### Get Candlestick Data

```
GET /api/v1/pairs/{symbol}/candles
```

**Query Parameters:**
- `cursor` (optional): Unix timestamp for cursor-based pagination
- `direction` (optional): "next" (default) or "prev" for pagination direction
- `limit` (optional): Number of candles per page (default: 1000, max: 5000)
- `start_date` (optional): ISO format date for initial load
- `end_date` (optional): ISO format date for initial load

**Response Format (Django-style pagination):**
```json
{
  "count": 23773,
  "next": "http://localhost:8000/api/v1/pairs/EURUSD/candles?cursor=1726447500&limit=1000",
  "previous": "http://localhost:8000/api/v1/pairs/EURUSD/candles?cursor=1726444800&limit=1000&direction=prev",
  "results": [
    {
      "time": 1726444800,
      "open": 1.10761,
      "high": 1.10774,
      "low": 1.10755,
      "close": 1.10761,
      "volume": 38
    }
    // ... more candles
  ]
}
```

### Get Available Pairs

```
GET /api/v1/pairs/
```

Returns list of available trading pairs.

## Data Format

The API serves candlestick data from CSV files located in `app/EURUSD_15m_1year.csv`.

Each candle contains:
- `time`: Unix timestamp (seconds)
- `open`: Opening price
- `high`: Highest price
- `low`: Lowest price
- `close`: Closing price
- `volume`: Tick volume

## Configuration

Configuration is managed in `app/core/config.py`:
- CORS origins for frontend
- CSV file path
- Pagination defaults (1000 per page, max 5000)

## Features

- ✅ Cursor-based pagination for efficient data loading
- ✅ Django-style paginated response format
- ✅ CORS enabled for frontend integration
- ✅ In-memory caching of CSV data
- ✅ Date range filtering
- ✅ Forward and backward pagination
- ✅ Interactive API documentation

## Drawings/Series API

Save and manage chart drawings (lines, channels, horizontal lines, etc.) for each trading pair.

### Endpoints

- `GET /api/v1/drawings/` - Get all drawings (filter by pair)
- `GET /api/v1/drawings/{id}` - Get specific drawing
- `POST /api/v1/drawings/` - Create new drawing
- `PUT /api/v1/drawings/{id}` - Update drawing
- `DELETE /api/v1/drawings/{id}` - Delete drawing
- `DELETE /api/v1/drawings/` - Delete all drawings (filter by pair)

**Storage:** Drawings are stored in `app/data/drawings.json`

**See:** [DRAWINGS_API.md](DRAWINGS_API.md) for detailed documentation and integration examples.

## Future Enhancements

- Add database support (PostgreSQL/TimescaleDB)
- Add multiple timeframe support (1m, 5m, 15m, 1h, 1d)
- Add real-time WebSocket streaming
- Add data compression (gzip)
- Add authentication
- Move drawings from JSON to database
- Add drawing templates and sharing

