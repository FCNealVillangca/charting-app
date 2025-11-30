from typing import Optional
import logging
from sqlalchemy.orm import Session, joinedload
from app.database.session import SessionLocal
from app.models.drawing import Drawing as DrawingModel
from app.models.series import Series as SeriesModel
from app.models.point import Point as PointModel
from app.models.pair import Pair as PairModel
from app.schemas.drawing import Drawing, DrawingCreate, DrawingUpdate, ChartBounds, Series


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
        # Prepare legacy metadata fallback for roles if needed
        dashed_id = None
        center_id = None
        is_channel = drawing_model.type == 'channel'
        legacy_meta = getattr(drawing_model, 'drawing_metadata', None) or {}
        if is_channel and isinstance(legacy_meta, dict):
            dashed_id = legacy_meta.get('dashedSeriesId')
            center_id = legacy_meta.get('centerSeriesId')

        series_list = []
        for idx, series_model in enumerate(drawing_model.series):
            # Base serialization
            series_dict = {
                "id": series_model.id,
                "name": getattr(series_model, 'name', None),
                "style": getattr(series_model, 'style', None),
                "points": [
                    {"id": point_model.id, "x": point_model.x, "y": point_model.y}
                    for point_model in series_model.points
                ],
            }

            # Ensure style is a dict and ensure color fallback from drawing
            style = series_dict.get("style") or {}
            if not isinstance(style, dict):
                style = {}
            if not style.get("color") and getattr(drawing_model, 'color', None):
                style["color"] = drawing_model.color
            series_dict["style"] = style

            # Legacy role mapping for channels if style is missing
            if is_channel:
                role = None
                if not style.get("role"):
                    if dashed_id is not None and series_model.id == dashed_id:
                        role = 'dashed'
                    elif center_id is not None and series_model.id == center_id:
                        role = 'center'
                    elif idx == 0:
                        role = 'base'
                    else:
                        role = 'parallel'
                    style["role"] = role
                    series_dict["style"] = style

            series_list.append(series_dict)

        return Drawing(
            id=drawing_model.id,
            name=drawing_model.name,
            type=drawing_model.type,
            color=drawing_model.color,
            series=series_list,
            pair=drawing_model.pair.symbol,
        )
    
    def _update_basic_drawing_fields(self, drawing_model: DrawingModel, updates: DrawingUpdate):
        """Update basic drawing fields (name, color)."""
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
            # Update name and style if provided
            if hasattr(series_data, 'name'):
                series_model.name = series_data.name
            if hasattr(series_data, 'style'):
                series_model.style = series_data.style
            self._update_points_for_series(db, series_model, series_data.points)
        else:
            # Series with this ID doesn't exist, create it
            self._create_new_series(db, drawing_id, series_data, series_idx)
    
    def _create_new_series(self, db: Session, drawing_id: int, series_data, series_idx: int):
        """Create a new series with its points"""
        series_model = SeriesModel(
            drawing_id=drawing_id,
            order_index=series_idx,
            name=getattr(series_data, 'name', None),
            style=getattr(series_data, 'style', None),
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

    def _extend_line_to_bounds(self, p1: dict, p2: dict, min_x: float, max_x: float, min_y: float, max_y: float) -> tuple:
        """Extend a line defined by two points to chart boundaries"""
        x1, y1 = p1['x'], p1['y']
        x2, y2 = p2['x'], p2['y']

        # Handle vertical lines
        if x2 == x1:
            return (
                {'x': x1, 'y': min_y},
                {'x': x1, 'y': max_y}
            )

        # Calculate slope and intercept
        m = (y2 - y1) / (x2 - x1)
        b = y1 - m * x1

        # Calculate y values at x boundaries
        y_at_min_x = m * min_x + b
        y_at_max_x = m * max_x + b

        return (
            {'x': min_x, 'y': y_at_min_x},
            {'x': max_x, 'y': y_at_max_x}
        )

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
    
    def create_drawing(self, drawing: DrawingCreate, chart_bounds: Optional[ChartBounds] = None) -> Drawing:
        """Create a new drawing with auto-generated IDs"""
        logger.debug(f"create_drawing pair={drawing.pair} type={drawing.type} series_count={len(drawing.series)}")
        
        # Access chart bounds from frontend (NOT saved to DB - just for calculations)
        if chart_bounds:
            print(f"📊 CHART BOUNDS IN SERVICE: minX={chart_bounds.minX}, maxX={chart_bounds.maxX}, minY={chart_bounds.minY}, maxY={chart_bounds.maxY}")

        # Extend channel lines to chart bounds with padding
        if drawing.type == 'channel' and len(drawing.series) == 2 and chart_bounds:
            # Extract base and parallel points
            base_points = drawing.series[0].points
            parallel_points = drawing.series[1].points

            logger.info(f"🔵 CHANNEL EXTENSION DEBUG:")
            logger.info(f"  Base points: ({base_points[0].x}, {base_points[0].y}) -> ({base_points[1].x}, {base_points[1].y})")
            logger.info(f"  Parallel points: ({parallel_points[0].x}, {parallel_points[0].y}) -> ({parallel_points[1].x}, {parallel_points[1].y})")

            # Calculate padding: extend 20% beyond the data range
            time_span = chart_bounds.maxX - chart_bounds.minX
            price_span = chart_bounds.maxY - chart_bounds.minY
            padding_x = time_span * 0.2  # 20% padding on time axis
            padding_y = price_span * 0.1  # 10% padding on price axis
            
            extended_min_x = chart_bounds.minX - padding_x
            extended_max_x = chart_bounds.maxX + padding_x
            extended_min_y = chart_bounds.minY - padding_y
            extended_max_y = chart_bounds.maxY + padding_y

            logger.info(f"  Chart bounds: minX={chart_bounds.minX}, maxX={chart_bounds.maxX}, minY={chart_bounds.minY}, maxY={chart_bounds.maxY}")
            logger.info(f"  Extended bounds: minX={extended_min_x}, maxX={extended_max_x}, minY={extended_min_y}, maxY={extended_max_y}")

            # Extend base line to extended bounds
            extended_base = self._extend_line_to_bounds(
                {'x': base_points[0].x, 'y': base_points[0].y},
                {'x': base_points[1].x, 'y': base_points[1].y},
                extended_min_x, extended_max_x,
                extended_min_y, extended_max_y
            )

            logger.info(f"  Extended base: ({extended_base[0]['x']}, {extended_base[0]['y']}) -> ({extended_base[1]['x']}, {extended_base[1]['y']})")

            # Calculate the perpendicular distance from parallel line to base line
            # Use the same method as frontend: calculate perpendicular distance from a point on parallel to base
            base_p1 = {'x': base_points[0].x, 'y': base_points[0].y}
            base_p2 = {'x': base_points[1].x, 'y': base_points[1].y}
            
            # Calculate direction vector and length of base line
            dx = base_p2['x'] - base_p1['x']
            dy = base_p2['y'] - base_p1['y']
            length = (dx * dx + dy * dy) ** 0.5
            
            logger.info(f"  Base line vector: dx={dx}, dy={dy}, length={length}")
            
            if length > 0:
                # Calculate perpendicular distance from first point of parallel line to base line
                # Formula matches frontend calculatePerpendicularDistance exactly:
                # ((point.y - lineStart.y) * dx - (point.x - lineStart.x) * dy) / length
                parallel_p1 = {'x': parallel_points[0].x, 'y': parallel_points[0].y}
                perpendicular_distance = ((parallel_p1['y'] - base_p1['y']) * dx - (parallel_p1['x'] - base_p1['x']) * dy) / length
                
                # Verify: calculate from second point too (should be same if lines are parallel)
                parallel_p2 = {'x': parallel_points[1].x, 'y': parallel_points[1].y}
                perpendicular_distance2 = ((parallel_p2['y'] - base_p1['y']) * dx - (parallel_p2['x'] - base_p1['x']) * dy) / length
                
                logger.info(f"  Perpendicular distance from p1: {perpendicular_distance}")
                logger.info(f"  Perpendicular distance from p2: {perpendicular_distance2}")
                logger.info(f"  Difference: {abs(perpendicular_distance - perpendicular_distance2)}")
                
                # Use average if they differ slightly (due to floating point), otherwise use first
                if abs(perpendicular_distance - perpendicular_distance2) < 0.0001:
                    # Lines are parallel, use the distance
                    final_distance = perpendicular_distance
                    logger.info(f"  Using distance: {final_distance} (from p1)")
                else:
                    # Lines might not be perfectly parallel, use average
                    final_distance = (perpendicular_distance + perpendicular_distance2) / 2.0
                    logger.info(f"  Using average distance: {final_distance}")
                
                # Calculate perpendicular unit vector (same as frontend calculateParallelLine)
                # Perpendicular to (dx, dy) is (-dy, dx), normalized
                perp_x = -dy / length
                perp_y = dx / length
                
                logger.info(f"  Perpendicular unit vector: ({perp_x}, {perp_y})")
                
                # Apply the perpendicular offset to extended base line points
                # This creates a parallel line at the exact same distance, maintaining the same slope
                extended_parallel = [
                    {
                        'x': extended_base[0]['x'] + perp_x * final_distance,
                        'y': extended_base[0]['y'] + perp_y * final_distance
                    },
                    {
                        'x': extended_base[1]['x'] + perp_x * final_distance,
                        'y': extended_base[1]['y'] + perp_y * final_distance
                    }
                ]
                
                logger.info(f"  Extended parallel: ({extended_parallel[0]['x']}, {extended_parallel[0]['y']}) -> ({extended_parallel[1]['x']}, {extended_parallel[1]['y']})")
                
                # Verify the slope of extended lines
                if extended_base[1]['x'] != extended_base[0]['x']:
                    base_slope = (extended_base[1]['y'] - extended_base[0]['y']) / (extended_base[1]['x'] - extended_base[0]['x'])
                    parallel_slope = (extended_parallel[1]['y'] - extended_parallel[0]['y']) / (extended_parallel[1]['x'] - extended_parallel[0]['x'])
                    logger.info(f"  Extended base slope: {base_slope}")
                    logger.info(f"  Extended parallel slope: {parallel_slope}")
                    logger.info(f"  Slope difference: {abs(base_slope - parallel_slope)}")
            else:
                # Fallback: if base line has no length, just extend parallel independently
                extended_parallel = self._extend_line_to_bounds(
                    {'x': parallel_points[0].x, 'y': parallel_points[0].y},
                    {'x': parallel_points[1].x, 'y': parallel_points[1].y},
                    extended_min_x, extended_max_x,
                    extended_min_y, extended_max_y
                )

            # Create extended base line series
            base_color = drawing.series[0].style.get('color') if drawing.series[0].style else '#000000'
            extended_base_series = {
                'name': 'extended_base',
                'style': {'color': base_color, 'extended': True},
                'points': [
                    {'x': extended_base[0]['x'], 'y': extended_base[0]['y']},
                    {'x': extended_base[1]['x'], 'y': extended_base[1]['y']}
                ]
            }

            # Create extended parallel line series
            parallel_color = drawing.series[1].style.get('color') if drawing.series[1].style else '#000000'
            extended_parallel_series = {
                'name': 'extended_parallel',
                'style': {'color': parallel_color, 'extended': True},
                'points': [
                    {'x': extended_parallel[0]['x'], 'y': extended_parallel[0]['y']},
                    {'x': extended_parallel[1]['x'], 'y': extended_parallel[1]['y']}
                ]
            }

            # Append extended lines to drawing series
            drawing.series.append(Series(**extended_base_series))
            drawing.series.append(Series(**extended_parallel_series))
        
        db = self._get_db()
        try:
            # Require pair (must exist)
            pair_id = self._require_pair_id(db, drawing.pair)
            
            # Create drawing (ID will be auto-generated)
            # Determine drawing color from first series style (fallback to provided or black)
            first_series_style = None
            try:
                first_series_style = drawing.series[0].style if drawing.series else None
            except Exception:
                first_series_style = None
            derived_color = None
            if isinstance(first_series_style, dict):
                derived_color = first_series_style.get('color')

            drawing_model = DrawingModel(
                name=drawing.name,
                type=drawing.type,
                color=drawing.color or derived_color or "#000000",
                pair_id=pair_id
            )
            db.add(drawing_model)
            db.flush()  # Get auto-generated ID
            
            # Create series and points
            for series_idx, series_data in enumerate(drawing.series):
                series_model = SeriesModel(
                    drawing_id=drawing_model.id,
                    order_index=series_idx,
                    name=getattr(series_data, 'name', None),
                    style=getattr(series_data, 'style', None),
                )
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
    
    def update_drawing(self, drawing_id: int, updates: DrawingUpdate, chart_bounds: Optional[ChartBounds] = None) -> Optional[Drawing]:
        """Update an existing drawing"""

        # Access chart bounds from frontend (NOT saved to DB - just for calculations)
        if chart_bounds:
            print(f"📊 CHART BOUNDS IN SERVICE (UPDATE): minX={chart_bounds.minX}, maxX={chart_bounds.maxX}, minY={chart_bounds.minY}, maxY={chart_bounds.maxY}")

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

                # Recalculate extended lines for channels if chart bounds provided
                if drawing_model.type == 'channel' and len(updates.series) >= 4 and chart_bounds:
                    # Get the base and parallel series (series 0 and 1)
                    base_series = updates.series[0] if len(updates.series) > 0 else None
                    parallel_series = updates.series[1] if len(updates.series) > 1 else None
                    extended_base_series = updates.series[2] if len(updates.series) > 2 else None
                    extended_parallel_series = updates.series[3] if len(updates.series) > 3 else None

                    # If we have the required series, recalculate extended lines
                    if base_series and parallel_series and extended_base_series and extended_parallel_series and len(base_series.points) >= 2 and len(parallel_series.points) >= 2:
                        # Extend base line to chart bounds
                        extended_base = self._extend_line_to_bounds(
                            {'x': base_series.points[0].x, 'y': base_series.points[0].y},
                            {'x': base_series.points[1].x, 'y': base_series.points[1].y},
                            chart_bounds.minX, chart_bounds.maxX,
                            chart_bounds.minY, chart_bounds.maxY
                        )

                        # Extend parallel line to chart bounds
                        extended_parallel = self._extend_line_to_bounds(
                            {'x': parallel_series.points[0].x, 'y': parallel_series.points[0].y},
                            {'x': parallel_series.points[1].x, 'y': parallel_series.points[1].y},
                            chart_bounds.minX, chart_bounds.maxX,
                            chart_bounds.minY, chart_bounds.maxY
                        )

                        # Update extended series points
                        extended_base_series.points[0].x = extended_base[0]['x']
                        extended_base_series.points[0].y = extended_base[0]['y']
                        extended_base_series.points[1].x = extended_base[1]['x']
                        extended_base_series.points[1].y = extended_base[1]['y']

                        extended_parallel_series.points[0].x = extended_parallel[0]['x']
                        extended_parallel_series.points[0].y = extended_parallel[0]['y']
                        extended_parallel_series.points[1].x = extended_parallel[1]['x']
                        extended_parallel_series.points[1].y = extended_parallel[1]['y']

                        # Update the series data with recalculated extended lines
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
