from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from app.models.visit_report import ReportStatus


class VisitItemUpdate(BaseModel):
    doctor_id: int
    visited: bool
    note: Optional[str] = None


class VisitReportCreate(BaseModel):
    area_id: int
    report_date: date


class VisitReportUpdate(BaseModel):
    items: List[VisitItemUpdate]


class VisitReportReview(BaseModel):
    approved: bool
    manager_note: Optional[str] = None


class DoctorBrief(BaseModel):
    id: int
    name: str
    speciality: Optional[str]
    model_config = {"from_attributes": True}


class VisitItemResponse(BaseModel):
    id: int
    doctor_id: int
    doctor: DoctorBrief
    visited: bool
    note: Optional[str]
    model_config = {"from_attributes": True}


class VisitReportResponse(BaseModel):
    id: int
    representative_id: int
    representative_name: str
    area_id: int
    area_name: str
    report_date: date
    status: ReportStatus
    manager_note: Optional[str]
    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]
    reviewed_by_name: Optional[str]
    created_at: datetime
    items: List[VisitItemResponse]

    model_config = {"from_attributes": True}
