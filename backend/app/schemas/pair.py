from pydantic import BaseModel, Field
from typing import Optional


class CandleData(BaseModel):
    """Individual candlestick data"""
    time: int = Field(..., description="Unix timestamp")
    open: float
    high: float
    low: float
    close: float
    volume: int = Field(..., description="Tick volume")
    
    class Config:
        from_attributes = True


class PaginatedCandleResponse(BaseModel):
    """Django-style paginated response with cursor pagination"""
    count: int = Field(..., description="Total number of candles")
    next: Optional[str] = Field(None, description="URL to next page")
    previous: Optional[str] = Field(None, description="URL to previous page")
    results: list[CandleData] = Field(..., description="Array of candle data")


class CandleQueryParams(BaseModel):
    """Query parameters for candle data endpoint"""
    cursor: Optional[int] = Field(None, description="Unix timestamp cursor for pagination")
    direction: Optional[str] = Field("next", description="Pagination direction: 'next' or 'prev'")
    limit: int = Field(1000, ge=1, le=5000, description="Number of candles per page")
    start_date: Optional[str] = Field(None, description="ISO format start date for initial load")
    end_date: Optional[str] = Field(None, description="ISO format end date for initial load")

