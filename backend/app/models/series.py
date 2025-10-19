from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Series(Base):
    __tablename__ = "series"

    id = Column(String, primary_key=True)  # UUID from frontend
    drawing_id = Column(String, ForeignKey("drawings.id", ondelete="CASCADE"), nullable=False, index=True)
    order_index = Column(Integer, nullable=False, default=0)

    # Relationships
    drawing = relationship("Drawing", back_populates="series")
    points = relationship("Point", back_populates="series", cascade="all, delete-orphan", order_by="Point.order_index")

