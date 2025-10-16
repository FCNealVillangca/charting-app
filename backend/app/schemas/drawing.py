from pydantic import BaseModel, Field
from typing import Optional, Any


class Point(BaseModel):
    """Point in a series"""
    id: str
    x: float
    y: float


class Series(BaseModel):
    """Series containing points"""
    id: str
    points: list[Point]


class Drawing(BaseModel):
    """Drawing/Series model"""
    id: str
    name: str
    type: str = Field(..., description="Type of drawing: dot, line, channel, hline, etc.")
    color: str
    series: list[Series]
    metadata: Optional[dict[str, Any]] = None
    pair: str = Field(..., description="Trading pair this drawing belongs to")
    
    class Config:
        from_attributes = True


class DrawingCreate(BaseModel):
    """Request model for creating a drawing"""
    id: str
    name: str
    type: str
    color: str
    series: list[Series]
    metadata: Optional[dict[str, Any]] = None
    pair: str


class DrawingUpdate(BaseModel):
    """Request model for updating a drawing"""
    name: Optional[str] = None
    color: Optional[str] = None
    series: Optional[list[Series]] = None
    metadata: Optional[dict[str, Any]] = None


class DrawingsResponse(BaseModel):
    """Response with list of drawings"""
    drawings: list[Drawing]
    count: int

