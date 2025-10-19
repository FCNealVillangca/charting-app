from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base


class Point(Base):
    __tablename__ = "points"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
<<<<<<< HEAD
    series_id = Column(Integer, ForeignKey("series.id", ondelete="CASCADE"), nullable=False, index=True)
=======
    series_id = Column(String, ForeignKey("series.id", ondelete="CASCADE"), nullable=False, index=True)
>>>>>>> 76340a99410339902d0a8777bea935c3f59bb446
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)

    # Relationships
    series = relationship("Series", back_populates="points")

