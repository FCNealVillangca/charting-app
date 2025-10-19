from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.database.base import Base


class Pair(Base):
    __tablename__ = "pairs"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, nullable=False, index=True)
    timeframe = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    drawings = relationship("Drawing", back_populates="pair", cascade="all, delete-orphan")

