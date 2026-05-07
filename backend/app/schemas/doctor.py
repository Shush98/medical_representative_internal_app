from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.doctor import DoctorStatus


class DoctorCreate(BaseModel):
    name: str
    speciality: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    area_id: int


class DoctorReview(BaseModel):
    approved: bool
    rejection_note: Optional[str] = None


class DoctorResponse(BaseModel):
    id: int
    name: str
    speciality: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    area_id: int
    area_name: str
    added_by: int
    added_by_name: str
    status: DoctorStatus
    rejection_note: Optional[str]
    approved_by: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}
