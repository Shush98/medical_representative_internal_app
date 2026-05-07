from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from app.models.visit_report import ReportStatus


class ExpenseItemCreate(BaseModel):
    description: str
    amount: Decimal


class ExpenseItemResponse(BaseModel):
    id: int
    description: str
    amount: Decimal
    model_config = {"from_attributes": True}


class ExpenseLimitCreate(BaseModel):
    area_id: int
    representative_id: int
    max_amount: Decimal


class ExpenseLimitResponse(BaseModel):
    id: int
    area_id: int
    area_name: str
    representative_id: int
    representative_name: str
    max_amount: Decimal
    updated_at: datetime
    model_config = {"from_attributes": True}


class ExpenseReportCreate(BaseModel):
    area_id: int
    report_date: date


class ExpenseReportUpdate(BaseModel):
    items: List[ExpenseItemCreate]


class ExpenseReportReview(BaseModel):
    approved: bool
    manager_note: Optional[str] = None


class ExpenseReportResponse(BaseModel):
    id: int
    representative_id: int
    representative_name: str
    area_id: int
    area_name: str
    report_date: date
    total_amount: Decimal
    status: ReportStatus
    manager_note: Optional[str]
    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]
    reviewed_by_name: Optional[str]
    created_at: datetime
    items: List[ExpenseItemResponse]
    limit: Optional[Decimal] = None

    model_config = {"from_attributes": True}
