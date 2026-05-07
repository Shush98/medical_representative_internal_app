import enum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class DoctorStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    speciality = Column(String(255))
    phone = Column(String(20))
    address = Column(Text)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    added_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(DoctorStatus), default=DoctorStatus.pending, nullable=False)
    rejection_note = Column(Text)
    approved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    area = relationship("Area", back_populates="doctors")
    adder = relationship("User", foreign_keys=[added_by])
    approver = relationship("User", foreign_keys=[approved_by])
