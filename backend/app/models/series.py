from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Series(Base):
    __tablename__ = "series"

<<<<<<< HEAD
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    drawing_id = Column(Integer, ForeignKey("drawings.id", ondelete="CASCADE"), nullable=False, index=True)
=======
    id = Column(String, primary_key=True)  # UUID from frontend
    drawing_id = Column(String, ForeignKey("drawings.id", ondelete="CASCADE"), nullable=False, index=True)
>>>>>>> 76340a99410339902d0a8777bea935c3f59bb446
    order_index = Column(Integer, nullable=False, default=0)

    # Relationships
    drawing = relationship("Drawing", back_populates="series")
    points = relationship("Point", back_populates="series", cascade="all, delete-orphan", order_by="Point.order_index")

