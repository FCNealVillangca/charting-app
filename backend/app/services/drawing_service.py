from typing import Optional
import logging
from sqlalchemy.orm import Session, joinedload
from app.database.session import SessionLocal
from app.models.drawing import Drawing as DrawingModel
from app.models.series import Series as SeriesModel
from app.models.point import Point as PointModel
from app.models.pair import Pair as PairModel
from app.schemas.drawing import Drawing, DrawingCreate, DrawingUpdate


logger = logging.getLogger(__name__)


class DrawingService:
    """Service for managing drawings stored in SQLite database"""
    
    # =============================================================================
    # HELPER METHODS (PRIVATE)
    # =============================================================================
    
    def _get_db(self) -> Session:
        """Get database session"""
        return SessionLocal()
    
    def _require_pair_id(self, db: Session, pair_symbol: str) -> int:
        """Return pair id for symbol, raise if missing (fast path selects only id)."""
        pair_id = (
            db.query(PairModel.id)
            .filter(PairModel.symbol == pair_symbol.upper())
            .scalar()
        )
        if pair_id is None:
            raise ValueError(f"Pair '{pair_symbol.upper()}' does not exist. Please create the pair first.")
        return int(pair_id)
    
    def _drawing_model_to_schema(self, drawing_model: DrawingModel) -> Drawing:
        """Convert SQLAlchemy Drawing model to Pydantic schema."""
        series_list = [
            {
                "id": series_model.id,
                "points": [
                    {"id": point_model.id, "x": point_model.x, "y": point_model.y}
                    for point_model in series_model.points
                ],
            }
            for series_model in drawing_model.series
        ]

        return Drawing(
            id=drawing_model.id,
            name=drawing_model.name,
            type=drawing_model.type,
            color=drawing_model.color,
            series=series_list,
            metadata=drawing_model.drawing_metadata,
            pair=drawing_model.pair.symbol,
        )
    
    def _update_basic_drawing_fields(self, drawing_model: DrawingModel, updates: DrawingUpdate):
        """Update basic drawing fields (name, color, metadata)"""
        update_data = updates.model_dump(exclude_unset=True, exclude={"series"})
        for field, value in update_data.items():
            setattr(drawing_model, field, value)
    
    def _update_series_data(self, db: Session, drawing_model: DrawingModel, series_list: list):
        """Update series and points for a drawing"""
        for series_idx, series_data in enumerate(series_list):
            if series_data.id is not None:
                self._update_existing_series(db, drawing_model.id, series_data, series_idx)
            else:
                self._create_new_series(db, drawing_model.id, series_data, series_idx)
    
    def _update_existing_series(self, db: Session, drawing_id: int, series_data, series_idx: int):
        """Update an existing series and its points"""
        series_model = db.query(SeriesModel).filter(
            SeriesModel.id == series_data.id,
            SeriesModel.drawing_id == drawing_id
        ).first()
        
        if series_model:
            series_model.order_index = series_idx
            self._update_points_for_series(db, series_model, series_data.points)
        else:
            # Series with this ID doesn't exist, create it
            self._create_new_series(db, drawing_id, series_data, series_idx)
    
    def _create_new_series(self, db: Session, drawing_id: int, series_data, series_idx: int):
        """Create a new series with its points"""
        series_model = SeriesModel(
            drawing_id=drawing_id,
            order_index=series_idx
        )
        db.add(series_model)
        db.flush()
        
        for point_idx, point_data in enumerate(series_data.points):
            self._create_new_point(db, series_model.id, point_data, point_idx)
    
    def _update_points_for_series(self, db: Session, series_model: SeriesModel, points_data: list):
        """Update points for an existing series"""
        for point_idx, point_data in enumerate(points_data):
            if point_data.id is not None:
                self._update_existing_point(db, series_model.id, point_data, point_idx)
            else:
                self._create_new_point(db, series_model.id, point_data, point_idx)
    
    def _update_existing_point(self, db: Session, series_id: int, point_data, point_idx: int):
        """Update an existing point"""
        point_model = db.query(PointModel).filter(
            PointModel.id == point_data.id,
            PointModel.series_id == series_id
        ).first()
        
        if point_model:
            point_model.x = point_data.x
            point_model.y = point_data.y
            point_model.order_index = point_idx
        else:
            # Point with this ID doesn't exist, create it
            self._create_new_point(db, series_id, point_data, point_idx)
    
    def _create_new_point(self, db: Session, series_id: int, point_data, point_idx: int):
        """Create a new point"""
        point_model = PointModel(
            series_id=series_id,
            x=point_data.x,
            y=point_data.y,
            order_index=point_idx
        )
        db.add(point_model)
    
    # =============================================================================
    # PUBLIC METHODS
    # =============================================================================
    
    def get_all_drawings(self, pair: Optional[str] = None) -> list[Drawing]:
        """Get all drawings, optionally filtered by trading pair"""
        logger.debug(f"get_all_drawings pair={pair}")
        db = self._get_db()
        try:
            query = db.query(DrawingModel).options(
                joinedload(DrawingModel.pair),
                joinedload(DrawingModel.series).joinedload(SeriesModel.points)
            )
            
            if pair:
                logger.debug(f"Filtering by pair: {pair.upper()}")
                query = query.join(PairModel).filter(PairModel.symbol == pair.upper())
            
            drawing_models = query.all()
            return [self._drawing_model_to_schema(d) for d in drawing_models]
        except Exception as e:
            logger.error(f"Error in get_all_drawings: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise
        finally:
            db.close()
    
    def get_drawing_by_id(self, drawing_id: int) -> Optional[Drawing]:
        """Get a single drawing by ID"""
        db = self._get_db()
        try:
            drawing_model = db.query(DrawingModel).options(
                joinedload(DrawingModel.pair),
                joinedload(DrawingModel.series).joinedload(SeriesModel.points)
            ).filter(DrawingModel.id == drawing_id).first()
            
            if not drawing_model:
                return None
            
            return self._drawing_model_to_schema(drawing_model)
        finally:
            db.close()
    
    def create_drawing(self, drawing: DrawingCreate) -> Drawing:
        """Create a new drawing with auto-generated IDs"""
        logger.debug(f"create_drawing pair={drawing.pair} type={drawing.type} series_count={len(drawing.series)}")
        
        db = self._get_db()
        try:
            # Require pair (must exist)
            pair_id = self._require_pair_id(db, drawing.pair)
            
            # Create drawing (ID will be auto-generated)
            drawing_model = DrawingModel(
                name=drawing.name,
                type=drawing.type,
                color=drawing.color,
                drawing_metadata=drawing.metadata,
                pair_id=pair_id
            )
            db.add(drawing_model)
            db.flush()  # Get auto-generated ID
            
            # Create series and points
            for series_idx, series_data in enumerate(drawing.series):
                series_model = SeriesModel(drawing_id=drawing_model.id, order_index=series_idx)
                db.add(series_model)
                db.flush()  # ensure series_model.id

                for point_idx, point_data in enumerate(series_data.points):
                    db.add(
                        PointModel(
                            series_id=series_model.id,
                            x=point_data.x,
                            y=point_data.y,
                            order_index=point_idx,
                        )
                    )
            
            db.commit()
            db.refresh(drawing_model)
            return self._drawing_model_to_schema(drawing_model)
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    def update_drawing(self, drawing_id: int, updates: DrawingUpdate) -> Optional[Drawing]:
        """Update an existing drawing"""
        db = self._get_db()
        try:
            drawing_model = db.query(DrawingModel).options(
                joinedload(DrawingModel.series).joinedload(SeriesModel.points)
            ).filter(DrawingModel.id == drawing_id).first()
            
            if not drawing_model:
                return None
            
            # Update basic fields
            self._update_basic_drawing_fields(drawing_model, updates)
            
            # Update series if provided
            if updates.series is not None:
                self._update_series_data(db, drawing_model, updates.series)
            
            db.commit()
            db.refresh(drawing_model)
            
            return self._drawing_model_to_schema(drawing_model)
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    def delete_drawing(self, drawing_id: int) -> bool:
        """Delete a drawing by ID"""
        db = self._get_db()
        try:
            drawing_model = db.query(DrawingModel).filter(DrawingModel.id == drawing_id).first()
            
            if not drawing_model:
                return False
            
            db.delete(drawing_model)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    def delete_all_drawings(self, pair: Optional[str] = None) -> int:
        """Delete all drawings, optionally filtered by pair. Returns count of deleted drawings."""
        db = self._get_db()
        try:
            query = db.query(DrawingModel)
            
            if pair:
                query = query.join(PairModel).filter(PairModel.symbol == pair.upper())
            
            deleted_count = query.delete(synchronize_session=False)
            db.commit()
            
            return deleted_count
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()


# Singleton instance
drawing_service = DrawingService()
