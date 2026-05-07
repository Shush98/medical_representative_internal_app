from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Date, Enum, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.models.visit_report import ReportStatus


class ExpenseLimit(Base):
    __tablename__ = "expense_limits"
    __table_args__ = (UniqueConstraint("area_id", "representative_id", name="uq_expense_limit"),)

    id = Column(Integer, primary_key=True, index=True)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    representative_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    max_amount = Column(Numeric(10, 2), nullable=False)
    set_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    area = relationship("Area")
    representative = relationship("User", foreign_keys=[representative_id])
    setter = relationship("User", foreign_keys=[set_by])


class ExpenseReport(Base):
    __tablename__ = "expense_reports"

    id = Column(Integer, primary_key=True, index=True)
    representative_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False)
    report_date = Column(Date, nullable=False)
    total_amount = Column(Numeric(10, 2), default=0, nullable=False)
    status = Column(Enum(ReportStatus), default=ReportStatus.draft, nullable=False)
    manager_note = Column(Text)
    submitted_at = Column(DateTime(timezone=True))
    reviewed_at = Column(DateTime(timezone=True))
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    representative = relationship("User", foreign_keys=[representative_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    area = relationship("Area")
    items = relationship("ExpenseItem", back_populates="report", cascade="all, delete-orphan")


class ExpenseItem(Base):
    __tablename__ = "expense_items"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("expense_reports.id", ondelete="CASCADE"), nullable=False)
    description = Column(String(255), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)

    report = relationship("ExpenseReport", back_populates="items")
