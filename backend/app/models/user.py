from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class UserArea(Base):
    __tablename__ = "user_areas"
    __table_args__ = (UniqueConstraint("user_id", "area_id", name="uq_user_area"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20))
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    role = relationship("Role", back_populates="users")
    areas = relationship("Area", secondary="user_areas", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.user_id")
