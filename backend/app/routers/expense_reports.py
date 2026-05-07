from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from app.database import get_db
from app.models import User, ExpenseReport, ExpenseItem, ExpenseLimit, ReportStatus
from app.schemas.expense import (
    ExpenseReportCreate, ExpenseReportUpdate, ExpenseReportReview, ExpenseReportResponse, ExpenseItemResponse,
)
from app.dependencies import get_current_user, require_manager, RoleChecker
from app.utils.audit import log_action

router = APIRouter(prefix="/expense-reports", tags=["expense-reports"])
require_rep = RoleChecker("representative", "manager", "administrator")


def _get_limit(db: Session, area_id: int, rep_id: int) -> Optional[Decimal]:
    limit = db.query(ExpenseLimit).filter(
        ExpenseLimit.area_id == area_id,
        ExpenseLimit.representative_id == rep_id,
    ).first()
    return limit.max_amount if limit else None


def _build_response(r: ExpenseReport, db: Session) -> ExpenseReportResponse:
    return ExpenseReportResponse(
        id=r.id,
        representative_id=r.representative_id,
        representative_name=r.representative.full_name,
        area_id=r.area_id,
        area_name=r.area.name,
        report_date=r.report_date,
        total_amount=r.total_amount,
        status=r.status,
        manager_note=r.manager_note,
        submitted_at=r.submitted_at,
        reviewed_at=r.reviewed_at,
        reviewed_by_name=r.reviewer.full_name if r.reviewer else None,
        created_at=r.created_at,
        items=[ExpenseItemResponse(id=i.id, description=i.description, amount=i.amount) for i in r.items],
        limit=_get_limit(db, r.area_id, r.representative_id),
    )


@router.get("", response_model=List[ExpenseReportResponse])
def list_reports(
    status: Optional[str] = None,
    area_id: Optional[int] = None,
    rep_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(ExpenseReport).options(
        joinedload(ExpenseReport.representative),
        joinedload(ExpenseReport.area),
        joinedload(ExpenseReport.reviewer),
        selectinload(ExpenseReport.items),
    )

    if current_user.role.name == "representative":
        q = q.filter(ExpenseReport.representative_id == current_user.id)
    elif rep_id:
        q = q.filter(ExpenseReport.representative_id == rep_id)

    if status:
        q = q.filter(ExpenseReport.status == status)
    if area_id:
        q = q.filter(ExpenseReport.area_id == area_id)

    return [_build_response(r, db) for r in q.order_by(ExpenseReport.report_date.desc()).all()]


@router.post("", response_model=ExpenseReportResponse, status_code=201)
def create_or_get_report(body: ExpenseReportCreate, db: Session = Depends(get_db), actor: User = Depends(require_rep)):
    if actor.role.name == "representative":
        if body.area_id not in [a.id for a in actor.areas]:
            raise HTTPException(status_code=403, detail="Not assigned to this area")

    existing = db.query(ExpenseReport).filter(
        ExpenseReport.representative_id == actor.id,
        ExpenseReport.area_id == body.area_id,
        ExpenseReport.report_date == body.report_date,
    ).first()
    if existing:
        return _build_response(existing, db)

    report = ExpenseReport(
        representative_id=actor.id,
        area_id=body.area_id,
        report_date=body.report_date,
        total_amount=Decimal("0"),
        status=ReportStatus.draft,
    )
    db.add(report)
    log_action(db, actor.id, "create_expense_report", "expense_report", details={"area_id": body.area_id})
    db.commit()
    db.refresh(report)
    return _build_response(report, db)


@router.put("/{report_id}", response_model=ExpenseReportResponse)
def update_report(
    report_id: int,
    body: ExpenseReportUpdate,
    db: Session = Depends(get_db),
    actor: User = Depends(require_rep),
):
    report = db.query(ExpenseReport).filter(ExpenseReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.representative_id != actor.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if report.status != ReportStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft reports can be edited")

    db.query(ExpenseItem).filter(ExpenseItem.report_id == report_id).delete()
    total = Decimal("0")
    for item_data in body.items:
        db.add(ExpenseItem(report_id=report_id, description=item_data.description, amount=item_data.amount))
        total += item_data.amount

    report.total_amount = total
    db.commit()
    db.refresh(report)
    return _build_response(report, db)


@router.post("/{report_id}/submit", response_model=ExpenseReportResponse)
def submit_report(report_id: int, db: Session = Depends(get_db), actor: User = Depends(require_rep)):
    report = db.query(ExpenseReport).filter(ExpenseReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.representative_id != actor.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if report.status != ReportStatus.draft:
        raise HTTPException(status_code=400, detail="Report already submitted")

    limit = _get_limit(db, report.area_id, actor.id)
    if limit is not None and report.total_amount > limit:
        raise HTTPException(
            status_code=422,
            detail=f"Total amount ₹{report.total_amount} exceeds limit ₹{limit} for this area",
        )

    report.status = ReportStatus.submitted
    report.submitted_at = datetime.utcnow()
    log_action(db, actor.id, "submit_expense_report", "expense_report", report_id)
    db.commit()
    db.refresh(report)
    return _build_response(report, db)


@router.patch("/{report_id}/review", response_model=ExpenseReportResponse)
def review_report(
    report_id: int,
    body: ExpenseReportReview,
    db: Session = Depends(get_db),
    actor: User = Depends(require_manager),
):
    report = db.query(ExpenseReport).filter(ExpenseReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != ReportStatus.submitted:
        raise HTTPException(status_code=400, detail="Report not in submitted state")

    report.status = ReportStatus.approved if body.approved else ReportStatus.rejected
    report.manager_note = body.manager_note
    report.reviewed_at = datetime.utcnow()
    report.reviewed_by = actor.id

    action = "approve_expense_report" if body.approved else "reject_expense_report"
    log_action(db, actor.id, action, "expense_report", report_id)
    db.commit()
    db.refresh(report)
    return _build_response(report, db)
