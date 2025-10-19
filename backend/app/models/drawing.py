from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base


class Drawing(Base):
    __tablename__ = "drawings"

<<<<<<< HEAD
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
=======
    id = Column(String, primary_key=True)  # UUID from frontend
>>>>>>> 76340a99410339902d0a8777bea935c3f59bb446
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # dot, line, channel, hline, etc.
    color = Column(String, nullable=False)
    drawing_metadata = Column(JSON, nullable=True)
    pair_id = Column(Integer, ForeignKey("pairs.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    pair = relationship("Pair", back_populates="drawings")
    series = relationship("Series", back_populates="drawing", cascade="all, delete-orphan", order_by="Series.order_index")

