from fastapi import APIRouter, HTTPException, Query, Request
from typing import Optional
from app.schemas.pair import PaginatedCandleResponse, CandleData
from app.services.data_service import data_service
from app.core.config import settings


router = APIRouter()


@router.get("/{symbol}/candles", response_model=PaginatedCandleResponse)
async def get_candles(
    request: Request,
    symbol: str,
    cursor: Optional[int] = Query(None, description="Unix timestamp cursor for pagination"),
    direction: Optional[str] = Query("next", description="Pagination direction: 'next' or 'prev'"),
    limit: int = Query(settings.DEFAULT_PAGE_LIMIT, ge=1, le=settings.MAX_PAGE_LIMIT),
    start_date: Optional[str] = Query(None, description="ISO format start date"),
    end_date: Optional[str] = Query(None, description="ISO format end date"),
):
    """
    Get paginated candlestick data with cursor-based pagination.
    
    - **symbol**: Trading pair symbol (e.g., EURUSD)
    - **cursor**: Unix timestamp to start pagination from
    - **direction**: 'next' for forward, 'prev' for backward pagination
    - **limit**: Number of candles to return (default 1000, max 5000)
    - **start_date**: Optional ISO format date for initial load
    - **end_date**: Optional ISO format date for initial load
    """
    try:
        # Validate direction
        if direction not in ["next", "prev"]:
            raise HTTPException(status_code=400, detail="direction must be 'next' or 'prev'")
        
        # Get candle data
        candles, total_count, next_cursor, prev_cursor = data_service.get_candles(
            symbol=symbol.upper(),
            cursor=cursor,
            direction=direction,
            limit=limit,
            start_date=start_date,
            end_date=end_date
        )
        
        # Build base URL
        base_url = str(request.url).split('?')[0]
        
        # Build next and previous URLs
        next_url = None
        prev_url = None
        
        if next_cursor and len(candles) == limit:
            # Only provide next URL if we got a full page (might be more data)
            next_url = f"{base_url}?cursor={next_cursor}&limit={limit}&direction=next"
        
        if prev_cursor and cursor is not None:
            # Only provide previous URL if we're not at the beginning
            prev_url = f"{base_url}?cursor={prev_cursor}&limit={limit}&direction=prev"
        
        return PaginatedCandleResponse(
            count=total_count,
            next=next_url,
            previous=prev_url,
            results=candles
        )
        
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/", response_model=list[str])
async def get_available_pairs():
    """Get list of available trading pairs"""
    # For now, we only have EURUSD
    return ["EURUSD"]

