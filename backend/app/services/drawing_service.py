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
        logger.debug(f"Converting drawing model id={drawing_model.id} to schema")
        logger.debug(f"Drawing has {len(drawing_model.series)} series")
        
        # Build series list with points
        series_list = []
        for series_model in sorted(drawing_model.series, key=lambda s: s.order_index):
            logger.debug(f"Processing series id={series_model.id} with {len(series_model.points)} points")
            points_list = []
            for point_model in sorted(series_model.points, key=lambda p: p.order_index):
                points_list.append({
                    "id": point_model.id,  # Use integer ID, not string
                    "x": point_model.x,
                    "y": point_model.y
                })
            
            series_list.append({
                "id": series_model.id,
                "points": points_list
            })
        
        logger.debug(f"Pair symbol: {drawing_model.pair.symbol}")
        
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
        logger.info(f"get_all_drawings called with pair={pair}")
        db = self._get_db()
        try:
            query = db.query(DrawingModel).options(
                joinedload(DrawingModel.pair),
                joinedload(DrawingModel.series).joinedload(SeriesModel.points)
            )
            
            if pair:
                logger.info(f"Filtering by pair: {pair.upper()}")
                query = query.join(PairModel).filter(PairModel.symbol == pair.upper())
            
            drawing_models = query.all()
            logger.info(f"Found {len(drawing_models)} drawings in database")
            
            result = [self._drawing_model_to_schema(d) for d in drawing_models]
            logger.info(f"Successfully converted {len(result)} drawings to schema")
            return result
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
        logger.info(f"create_drawing called for pair={drawing.pair}, type={drawing.type}")
        logger.info(f"Drawing has {len(drawing.series)} series")
        
        db = self._get_db()
        try:
            # Get or create pair
            logger.info(f"Getting or creating pair: {drawing.pair}")
            pair = self._get_or_create_pair(db, drawing.pair)
            logger.info(f"Pair id={pair.id}, symbol={pair.symbol}")
            
            # Create drawing (ID will be auto-generated)
            logger.info("Creating drawing model...")
            drawing_model = DrawingModel(
                name=drawing.name,
                type=drawing.type,
                color=drawing.color,
                drawing_metadata=drawing.metadata,
                pair_id=pair.id
            )
            db.add(drawing_model)
            db.flush()  # Flush to get auto-generated ID
            logger.info(f"Drawing model created with id={drawing_model.id}")
            
            # Create series and points
            for series_idx, series_data in enumerate(drawing.series):
                logger.info(f"Creating series {series_idx} with {len(series_data.points)} points")
                series_model = SeriesModel(
                    drawing_id=drawing_model.id,
                    order_index=series_idx
                )
                db.add(series_model)
                db.flush()  # Flush to get auto-generated ID
                logger.info(f"Series created with id={series_model.id}")
                
                # Create points
                for point_idx, point_data in enumerate(series_data.points):
                    logger.debug(f"Creating point {point_idx}: x={point_data.x}, y={point_data.y}")
                    point_model = PointModel(
                        series_id=series_model.id,
                        x=point_data.x,
                        y=point_data.y,
                        order_index=point_idx
                    )
                    db.add(point_model)
            
            logger.info("Committing transaction...")
            db.commit()
            db.refresh(drawing_model)
            logger.info(f"Drawing created successfully with id={drawing_model.id}")
            
            result = self._drawing_model_to_schema(drawing_model)
            logger.info(f"Returning drawing schema")
            return result
        except Exception as e:
            logger.error(f"Error creating drawing: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
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
                # Update existing series and points instead of deleting
                for series_idx, series_data in enumerate(updates.series):
                    if series_data.id is not None:
                        # Update existing series
                        series_model = db.query(SeriesModel).filter(
                            SeriesModel.id == series_data.id,
                            SeriesModel.drawing_id == drawing_id
                        ).first()
                        
                        if series_model:
                            series_model.order_index = series_idx
                            
                            # Update existing points
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
                                    else:
                                        # Point doesn't exist, create it
                                        point_model = PointModel(
                                            series_id=series_model.id,
                                            x=point_data.x,
                                            y=point_data.y,
                                            order_index=point_idx
                                        )
                                        db.add(point_model)
                                else:
                                    # New point without ID, create it
                                    point_model = PointModel(
                                        series_id=series_model.id,
                                        x=point_data.x,
                                        y=point_data.y,
                                        order_index=point_idx
                                    )
                                    db.add(point_model)
                        else:
                            # Series doesn't exist, create it
                            series_model = SeriesModel(
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
                    else:
                        # New series without ID, create it
                        series_model = SeriesModel(
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
