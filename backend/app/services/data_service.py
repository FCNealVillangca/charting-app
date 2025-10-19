import pandas as pd
from pathlib import Path
from datetime import datetime
from typing import Optional
from app.core.config import settings
from app.schemas.pair import CandleData


class DataService:
    """Service for loading and managing CSV trading data"""
    
    def __init__(self):
        self._data_cache = {}
        
    def load_csv_data(self, symbol: str) -> pd.DataFrame:
        """Load CSV data and cache it in memory"""
        if symbol in self._data_cache:
            return self._data_cache[symbol]
        
        # For now, we only have EURUSD data
        csv_path = settings.CSV_FILE_PATH
        
        if not csv_path.exists():
            raise FileNotFoundError(f"CSV file not found: {csv_path}")
        
        # Load CSV
        df = pd.read_csv(csv_path)
        
        # Ensure time column is integer (unix timestamp)
        df['time'] = df['time'].astype(int)
        
        # Sort by time (ascending)
        df = df.sort_values('time')
        
        # Rename tick_volume to volume for consistency
        if 'tick_volume' in df.columns:
            df = df.rename(columns={'tick_volume': 'volume'})
        
        # Select only needed columns
        df = df[['time', 'open', 'high', 'low', 'close', 'volume']]
        
        # Cache the data
        self._data_cache[symbol] = df
        
        return df
    
    def get_candles(
        self,
        symbol: str,
        cursor: Optional[int] = None,
        direction: str = "next",
        limit: int = 1000,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> tuple[list[CandleData], int, Optional[int], Optional[int]]:
        """
        Get paginated candle data with cursor-based pagination
        
        Returns:
            tuple: (candles, total_count, next_cursor, prev_cursor)
        """
        df = self.load_csv_data(symbol)
        
        # Apply date range filters if provided (for initial load)
        if start_date:
            start_timestamp = int(datetime.fromisoformat(start_date.replace('Z', '+00:00')).timestamp())
            df = df[df['time'] >= start_timestamp]
        
        if end_date:
            end_timestamp = int(datetime.fromisoformat(end_date.replace('Z', '+00:00')).timestamp())
            df = df[df['time'] <= end_timestamp]
        
        total_count = len(df)
        
        # Apply cursor pagination
        if cursor is not None:
            if direction == "prev":
                # Get data before cursor (going backward in time)
                df = df[df['time'] < cursor]
                # Take the last 'limit' rows (most recent before cursor)
                df = df.tail(limit)
            else:  # direction == "next"
                # Get data after cursor (going forward in time)
                df = df[df['time'] > cursor]
                # Take the first 'limit' rows
                df = df.head(limit)
        else:
            # No cursor provided, get the last 'limit' rows (most recent data)
            df = df.tail(limit)
        
        # Convert to list of CandleData
        candles = [
            CandleData(
                time=int(row['time']),
                open=float(row['open']),
                high=float(row['high']),
                low=float(row['low']),
                close=float(row['close']),
                volume=int(row['volume'])
            )
            for _, row in df.iterrows()
        ]
        
        # Determine next and previous cursors
        next_cursor = None
        prev_cursor = None
        
        if len(candles) > 0:
            # Next cursor is the timestamp of the last candle
            next_cursor = candles[-1].time
            # Previous cursor is the timestamp of the first candle
            prev_cursor = candles[0].time
        
        return candles, total_count, next_cursor, prev_cursor


# Singleton instance
data_service = DataService()

