from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.schemas.drawing import Drawing, DrawingCreate, DrawingUpdate, DrawingsResponse
from app.services.drawing_service import drawing_service


router = APIRouter()


@router.get("/", response_model=DrawingsResponse)
async def get_drawings(
    pair: Optional[str] = Query(None, description="Filter by trading pair (e.g., EURUSD)")
):
    """
    Get all drawings, optionally filtered by trading pair.
    """
    try:
        drawings = drawing_service.get_all_drawings(pair=pair)
        return DrawingsResponse(
            drawings=drawings,
            count=len(drawings)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching drawings: {str(e)}")


@router.get("/{drawing_id}", response_model=Drawing)
async def get_drawing(drawing_id: str):
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
    try:
        created_drawing = drawing_service.create_drawing(drawing)
        return created_drawing
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating drawing: {str(e)}")


@router.put("/{drawing_id}", response_model=Drawing)
async def update_drawing(drawing_id: str, updates: DrawingUpdate):
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
async def delete_drawing(drawing_id: str):
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

