from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import traceback
import logging
from app.schemas.drawing import Drawing, DrawingCreate, DrawingUpdate, DrawingsResponse
from app.services.drawing_service import drawing_service


router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=DrawingsResponse)
async def get_drawings(
    pair: Optional[str] = Query(None, description="Filter by trading pair (e.g., EURUSD)")
):
    """
    Get all drawings, optionally filtered by trading pair.
    """
    logger.info(f"GET /drawings/ called with pair={pair}")
    try:
        drawings = drawing_service.get_all_drawings(pair=pair)
        logger.info(f"Successfully fetched {len(drawings)} drawings")
        return DrawingsResponse(
            drawings=drawings,
            count=len(drawings)
        )
    except Exception as e:
        logger.error(f"ERROR fetching drawings: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching drawings: {str(e)}")


@router.get("/{drawing_id}", response_model=Drawing)
async def get_drawing(drawing_id: int):
    """
    Get a specific drawing by ID.
    """
    drawing = drawing_service.get_drawing_by_id(drawing_id)
    
    if not drawing:
        raise HTTPException(status_code=404, detail=f"Drawing with id {drawing_id} not found")
    
    return drawing


@router.post("/", response_model=Drawing, status_code=201)
async def create_drawing(drawing: DrawingCreate):
    """
    Create a new drawing.
    """
    logger.info(f"POST /drawings/ called")
    logger.info(f"Received drawing data: {drawing.model_dump()}")
    logger.info(f"Drawing name: {drawing.name}, type: {drawing.type}, color: {drawing.color}, pair: {drawing.pair}")
    logger.info(f"Number of series: {len(drawing.series)}")
    for i, series in enumerate(drawing.series):
        logger.info(f"Series {i}: id={series.id}, points count={len(series.points)}")
        for j, point in enumerate(series.points):
            logger.info(f"  Point {j}: id={point.id}, x={point.x}, y={point.y}")
    
    try:
        created_drawing = drawing_service.create_drawing(drawing)
        logger.info(f"Successfully created drawing with id={created_drawing.id}")
        return created_drawing
    except ValueError as e:
        logger.error(f"ValueError creating drawing: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"ERROR creating drawing: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error creating drawing: {str(e)}")


@router.put("/{drawing_id}", response_model=Drawing)
async def update_drawing(drawing_id: int, updates: DrawingUpdate):
    """
    Update an existing drawing.
    """
    try:
        updated_drawing = drawing_service.update_drawing(drawing_id, updates)
        
        if not updated_drawing:
            raise HTTPException(status_code=404, detail=f"Drawing with id {drawing_id} not found")
        
        return updated_drawing
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating drawing: {str(e)}")


@router.delete("/{drawing_id}")
async def delete_drawing(drawing_id: int):
    """
    Delete a specific drawing by ID.
    """
    success = drawing_service.delete_drawing(drawing_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Drawing with id {drawing_id} not found")
    
    return {"message": f"Drawing {drawing_id} deleted successfully"}


@router.delete("/")
async def delete_all_drawings(
    pair: Optional[str] = Query(None, description="Delete only drawings for specific pair")
):
    """
    Delete all drawings, optionally filtered by trading pair.
    """
    try:
        deleted_count = drawing_service.delete_all_drawings(pair=pair)
        
        message = f"Deleted {deleted_count} drawing(s)"
        if pair:
            message += f" for pair {pair}"
        
        return {"message": message, "deleted_count": deleted_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting drawings: {str(e)}")

