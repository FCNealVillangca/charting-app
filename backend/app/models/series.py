from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base


class Series(Base):
    __tablename__ = "series"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    drawing_id = Column(Integer, ForeignKey("drawings.id", ondelete="CASCADE"), nullable=False, index=True)
    order_index = Column(Integer, nullable=False, default=0)
    name = Column(String, nullable=True)
    style = Column(JSON, nullable=True)

    # Relationships
    drawing = relationship("Drawing", back_populates="series")
    points = relationship("Point", back_populates="series", cascade="all, delete-orphan", order_by="Point.order_index")

