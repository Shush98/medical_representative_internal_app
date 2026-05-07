from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", foreign_keys=[created_by])
    users = relationship("User", secondary="user_areas", back_populates="areas")
    doctors = relationship("Doctor", back_populates="area")
