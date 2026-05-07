import enum
from sqlalchemy import Column, Integer, Text, Boolean, ForeignKey, DateTime, Date, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ReportStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    approved = "approved"
    rejected = "rejected"


class VisitReport(Base):
    __tablename__ = "visit_reports"

    id = Column(Integer, primary_key=True, index=True)
    representative_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    report_date = Column(Date, nullable=False)
    status = Column(Enum(ReportStatus), default=ReportStatus.draft, nullable=False)
    manager_note = Column(Text)
    submitted_at = Column(DateTime(timezone=True))
    reviewed_at = Column(DateTime(timezone=True))
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    representative = relationship("User", foreign_keys=[representative_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    area = relationship("Area")
    items = relationship("VisitItem", back_populates="report", cascade="all, delete-orphan")


class VisitItem(Base):
    __tablename__ = "visit_items"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("visit_reports.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    visited = Column(Boolean, default=False, nullable=False)
    note = Column(Text)

    report = relationship("VisitReport", back_populates="items")
    doctor = relationship("Doctor")
