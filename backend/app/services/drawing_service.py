from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.database.session import SessionLocal
from app.models.drawing import Drawing as DrawingModel
from app.models.series import Series as SeriesModel
from app.models.point import Point as PointModel
from app.models.pair import Pair as PairModel
from app.schemas.drawing import Drawing, DrawingCreate, DrawingUpdate


class DrawingService:
    """Service for managing drawings stored in SQLite database"""
    
    def _get_db(self) -> Session:
        """Get database session"""
        return SessionLocal()
    
    def _get_or_create_pair(self, db: Session, pair_symbol: str) -> PairModel:
        """Get existing pair or create if doesn't exist"""
        pair = db.query(PairModel).filter(PairModel.symbol == pair_symbol.upper()).first()
        if not pair:
            # Create new pair if it doesn't exist
            pair = PairModel(
                symbol=pair_symbol.upper(),
                timeframe="15m",  # Default timeframe
                description=f"{pair_symbol.upper()} Trading Pair",
                is_active=True
            )
            db.add(pair)
            db.commit()
            db.refresh(pair)
        return pair
    
    def _drawing_model_to_schema(self, drawing_model: DrawingModel) -> Drawing:
        """Convert SQLAlchemy Drawing model to Pydantic schema"""
        # Build series list with points
        series_list = []
        for series_model in sorted(drawing_model.series, key=lambda s: s.order_index):
            points_list = []
            for point_model in sorted(series_model.points, key=lambda p: p.order_index):
                points_list.append({
<<<<<<< HEAD
                    "id": point_model.id,
=======
                    "id": f"point-{point_model.id}",
>>>>>>> 76340a99410339902d0a8777bea935c3f59bb446
                    "x": point_model.x,
                    "y": point_model.y
                })
            
            series_list.append({
                "id": series_model.id,
                "points": points_list
            })
        
        return Drawing(
            id=drawing_model.id,
            name=drawing_model.name,
            type=drawing_model.type,
            color=drawing_model.color,
            series=series_list,
            metadata=drawing_model.drawing_metadata,
            pair=drawing_model.pair.symbol
        )
    
    def get_all_drawings(self, pair: Optional[str] = None) -> list[Drawing]:
        """Get all drawings, optionally filtered by trading pair"""
        db = self._get_db()
        try:
            query = db.query(DrawingModel).options(
                joinedload(DrawingModel.pair),
                joinedload(DrawingModel.series).joinedload(SeriesModel.points)
            )
            
            if pair:
                query = query.join(PairModel).filter(PairModel.symbol == pair.upper())
            
            drawing_models = query.all()
            return [self._drawing_model_to_schema(d) for d in drawing_models]
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
        """Create a new drawing"""
        db = self._get_db()
        try:
<<<<<<< HEAD
            # Get or create pair
            pair = self._get_or_create_pair(db, drawing.pair)
            
            # Create drawing (ID will be auto-generated)
            drawing_model = DrawingModel(
=======
            # Check if drawing with this ID already exists
            existing = db.query(DrawingModel).filter(DrawingModel.id == drawing.id).first()
            if existing:
                raise ValueError(f"Drawing with id {drawing.id} already exists")
            
            # Get or create pair
            pair = self._get_or_create_pair(db, drawing.pair)
            
            # Create drawing
            drawing_model = DrawingModel(
                id=drawing.id,
>>>>>>> 76340a99410339902d0a8777bea935c3f59bb446
                name=drawing.name,
                type=drawing.type,
                color=drawing.color,
                drawing_metadata=drawing.metadata,
                pair_id=pair.id
            )
            db.add(drawing_model)
<<<<<<< HEAD
            db.flush()  # Flush to get the auto-generated ID
=======
            db.flush()  # Flush to get the drawing in the session
>>>>>>> 76340a99410339902d0a8777bea935c3f59bb446
            
            # Create series and points
            for series_idx, series_data in enumerate(drawing.series):
                series_model = SeriesModel(
<<<<<<< HEAD
=======
                    id=series_data.id,
>>>>>>> 76340a99410339902d0a8777bea935c3f59bb446
                    drawing_id=drawing_model.id,
                    order_index=series_idx
                )
                db.add(series_model)
                db.flush()
                
                # Create points
                for point_idx, point_data in enumerate(series_data.points):
                    point_model = PointModel(
                        series_id=series_model.id,
                        x=point_data.x,
                        y=point_data.y,
                        order_index=point_idx
                    )
                    db.add(point_model)
            
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
            update_data = updates.model_dump(exclude_unset=True, exclude={'series'})
            for field, value in update_data.items():
                setattr(drawing_model, field, value)
            
            # Update series if provided
            if updates.series is not None:
<<<<<<< HEAD
                # Track which series IDs are in the update
                updated_series_ids = set()
                
                for series_idx, series_data in enumerate(updates.series):
                    if series_data.id is not None:
                        # Update existing series
                        series_model = db.query(SeriesModel).filter(
                            SeriesModel.id == series_data.id,
                            SeriesModel.drawing_id == drawing_id
                        ).first()
                        
                        if series_model:
                            series_model.order_index = series_idx
                            updated_series_ids.add(series_data.id)
                            
                            # Track which point IDs are in the update
                            updated_point_ids = set()
                            
                            for point_idx, point_data in enumerate(series_data.points):
                                if point_data.id is not None:
                                    # Update existing point
                                    point_model = db.query(PointModel).filter(
                                        PointModel.id == point_data.id,
                                        PointModel.series_id == series_model.id
                                    ).first()
                                    
                                    if point_model:
                                        point_model.x = point_data.x
                                        point_model.y = point_data.y
                                        point_model.order_index = point_idx
                                        updated_point_ids.add(point_data.id)
                                else:
                                    # Create new point
                                    point_model = PointModel(
                                        series_id=series_model.id,
                                        x=point_data.x,
                                        y=point_data.y,
                                        order_index=point_idx
                                    )
                                    db.add(point_model)
                                    db.flush()
                                    updated_point_ids.add(point_model.id)
                            
                            # Delete points not in update
                            db.query(PointModel).filter(
                                PointModel.series_id == series_model.id,
                                ~PointModel.id.in_(updated_point_ids)
                            ).delete(synchronize_session=False)
                    else:
                        # Create new series
                        series_model = SeriesModel(
                            drawing_id=drawing_model.id,
                            order_index=series_idx
                        )
                        db.add(series_model)
                        db.flush()
                        updated_series_ids.add(series_model.id)
                        
                        # Create points for new series
                        for point_idx, point_data in enumerate(series_data.points):
                            point_model = PointModel(
                                series_id=series_model.id,
                                x=point_data.x,
                                y=point_data.y,
                                order_index=point_idx
                            )
                            db.add(point_model)
                
                # Delete series not in update (cascade will delete points)
                db.query(SeriesModel).filter(
                    SeriesModel.drawing_id == drawing_id,
                    ~SeriesModel.id.in_(updated_series_ids)
                ).delete(synchronize_session=False)
=======
                # Delete existing series (cascade will delete points)
                db.query(SeriesModel).filter(SeriesModel.drawing_id == drawing_id).delete()
                db.flush()
                
                # Create new series and points
                for series_idx, series_data in enumerate(updates.series):
                    series_model = SeriesModel(
                        id=series_data.id,
                        drawing_id=drawing_model.id,
                        order_index=series_idx
                    )
                    db.add(series_model)
                    db.flush()
                    
                    for point_idx, point_data in enumerate(series_data.points):
                        point_model = PointModel(
                            series_id=series_model.id,
                            x=point_data.x,
                            y=point_data.y,
                            order_index=point_idx
                        )
                        db.add(point_model)
>>>>>>> 76340a99410339902d0a8777bea935c3f59bb446
            
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
