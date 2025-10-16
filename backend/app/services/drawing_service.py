import json
from pathlib import Path
from typing import Optional
from app.schemas.drawing import Drawing, DrawingCreate, DrawingUpdate
from app.core.config import settings


class DrawingService:
    """Service for managing drawings stored in JSON file"""
    
    def __init__(self):
        self.drawings_file = Path(settings.DATA_DIR) / "drawings.json"
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        """Create drawings.json file if it doesn't exist"""
        self.drawings_file.parent.mkdir(parents=True, exist_ok=True)
        if not self.drawings_file.exists():
            self.drawings_file.write_text(json.dumps([]))
    
    def _load_drawings(self) -> list[dict]:
        """Load all drawings from JSON file"""
        try:
            content = self.drawings_file.read_text()
            return json.loads(content)
        except (json.JSONDecodeError, FileNotFoundError):
            return []
    
    def _save_drawings(self, drawings: list[dict]):
        """Save all drawings to JSON file"""
        self.drawings_file.write_text(json.dumps(drawings, indent=2))
    
    def get_all_drawings(self, pair: Optional[str] = None) -> list[Drawing]:
        """Get all drawings, optionally filtered by trading pair"""
        drawings = self._load_drawings()
        
        if pair:
            drawings = [d for d in drawings if d.get("pair") == pair.upper()]
        
        return [Drawing(**d) for d in drawings]
    
    def get_drawing_by_id(self, drawing_id: str) -> Optional[Drawing]:
        """Get a single drawing by ID"""
        drawings = self._load_drawings()
        
        for drawing in drawings:
            if drawing.get("id") == drawing_id:
                return Drawing(**drawing)
        
        return None
    
    def create_drawing(self, drawing: DrawingCreate) -> Drawing:
        """Create a new drawing"""
        drawings = self._load_drawings()
        
        # Check if drawing with this ID already exists
        existing_ids = [d.get("id") for d in drawings]
        if drawing.id in existing_ids:
            raise ValueError(f"Drawing with id {drawing.id} already exists")
        
        # Convert to dict and add to list
        new_drawing = drawing.model_dump()
        drawings.append(new_drawing)
        
        # Save to file
        self._save_drawings(drawings)
        
        return Drawing(**new_drawing)
    
    def update_drawing(self, drawing_id: str, updates: DrawingUpdate) -> Optional[Drawing]:
        """Update an existing drawing"""
        drawings = self._load_drawings()
        
        for i, drawing in enumerate(drawings):
            if drawing.get("id") == drawing_id:
                # Update only provided fields
                update_data = updates.model_dump(exclude_unset=True)
                drawings[i].update(update_data)
                
                # Save to file
                self._save_drawings(drawings)
                
                return Drawing(**drawings[i])
        
        return None
    
    def delete_drawing(self, drawing_id: str) -> bool:
        """Delete a drawing by ID"""
        drawings = self._load_drawings()
        
        initial_length = len(drawings)
        drawings = [d for d in drawings if d.get("id") != drawing_id]
        
        if len(drawings) < initial_length:
            self._save_drawings(drawings)
            return True
        
        return False
    
    def delete_all_drawings(self, pair: Optional[str] = None) -> int:
        """Delete all drawings, optionally filtered by pair. Returns count of deleted drawings."""
        drawings = self._load_drawings()
        initial_count = len(drawings)
        
        if pair:
            drawings = [d for d in drawings if d.get("pair") != pair.upper()]
        else:
            drawings = []
        
        deleted_count = initial_count - len(drawings)
        self._save_drawings(drawings)
        
        return deleted_count


# Singleton instance
drawing_service = DrawingService()

