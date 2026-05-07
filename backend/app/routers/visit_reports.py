from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional
from datetime import datetime, date
from app.database import get_db
from app.models import User, Area, Doctor, DoctorStatus, VisitReport, VisitItem, ReportStatus
from app.schemas.visit_report import (
    VisitReportCreate, VisitReportUpdate, VisitReportReview,
    VisitReportResponse, VisitItemResponse, DoctorBrief,
)
from app.dependencies import get_current_user, require_manager, RoleChecker
from app.utils.audit import log_action

router = APIRouter(prefix="/visit-reports", tags=["visit-reports"])
require_rep = RoleChecker("representative", "manager", "administrator")


def _build_response(r: VisitReport) -> VisitReportResponse:
    return VisitReportResponse(
        id=r.id,
        representative_id=r.representative_id,
        representative_name=r.representative.full_name,
        area_id=r.area_id,
        area_name=r.area.name,
        report_date=r.report_date,
        status=r.status,
        manager_note=r.manager_note,
        submitted_at=r.submitted_at,
        reviewed_at=r.reviewed_at,
        reviewed_by_name=r.reviewer.full_name if r.reviewer else None,
        created_at=r.created_at,
        items=[
            VisitItemResponse(
                id=i.id,
                doctor_id=i.doctor_id,
                doctor=DoctorBrief(id=i.doctor.id, name=i.doctor.name, speciality=i.doctor.speciality),
                visited=i.visited,
                note=i.note,
            )
            for i in r.items
        ],
    )


@router.get("", response_model=List[VisitReportResponse])
def list_reports(
    status: Optional[str] = None,
    area_id: Optional[int] = None,
    rep_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(VisitReport).options(
        joinedload(VisitReport.representative),
        joinedload(VisitReport.area),
        joinedload(VisitReport.reviewer),
        selectinload(VisitReport.items).joinedload(VisitItem.doctor),
    )

    if current_user.role.name == "representative":
        q = q.filter(VisitReport.representative_id == current_user.id)
    elif rep_id:
        q = q.filter(VisitReport.representative_id == rep_id)

    if status:
        q = q.filter(VisitReport.status == status)
    if area_id:
        q = q.filter(VisitReport.area_id == area_id)

    return [_build_response(r) for r in q.order_by(VisitReport.report_date.desc()).all()]


@router.post("", response_model=VisitReportResponse, status_code=201)
def create_or_get_report(body: VisitReportCreate, db: Session = Depends(get_db), actor: User = Depends(require_rep)):
    if actor.role.name == "representative":
        if body.area_id not in [a.id for a in actor.areas]:
            raise HTTPException(status_code=403, detail="Not assigned to this area")

    existing = db.query(VisitReport).filter(
        VisitReport.representative_id == actor.id,
        VisitReport.area_id == body.area_id,
        VisitReport.report_date == body.report_date,
    ).first()
    if existing:
        if existing.status == ReportStatus.draft:
            existing_ids = {item.doctor_id for item in existing.items}
            new_doctors = db.query(Doctor).filter(
                Doctor.area_id == body.area_id,
                Doctor.status == DoctorStatus.approved,
                Doctor.id.notin_(existing_ids),
            ).all()
            if new_doctors:
                for doc in new_doctors:
                    db.add(VisitItem(report_id=existing.id, doctor_id=doc.id, visited=False))
                db.commit()
                db.refresh(existing)
        return _build_response(existing)

    report = VisitReport(
        representative_id=actor.id,
        area_id=body.area_id,
        report_date=body.report_date,
        status=ReportStatus.draft,
    )
    db.add(report)
    db.flush()

    approved_doctors = db.query(Doctor).filter(
        Doctor.area_id == body.area_id,
        Doctor.status == DoctorStatus.approved,
    ).all()
    for doc in approved_doctors:
        db.add(VisitItem(report_id=report.id, doctor_id=doc.id, visited=False))

    log_action(db, actor.id, "create_visit_report", "visit_report", report.id)
    db.commit()
    db.refresh(report)
    return _build_response(report)


@router.get("/{report_id}", response_model=VisitReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(VisitReport).filter(VisitReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if current_user.role.name == "representative" and report.representative_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return _build_response(report)


@router.put("/{report_id}", response_model=VisitReportResponse)
def update_report(
    report_id: int,
    body: VisitReportUpdate,
    db: Session = Depends(get_db),
    actor: User = Depends(require_rep),
):
    report = db.query(VisitReport).filter(VisitReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.representative_id != actor.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if report.status != ReportStatus.draft:
        raise HTTPException(status_code=400, detail="Only draft reports can be edited")

    for item_data in body.items:
        item = db.query(VisitItem).filter(
            VisitItem.report_id == report_id,
            VisitItem.doctor_id == item_data.doctor_id,
        ).first()
        if item:
            item.visited = item_data.visited
            item.note = item_data.note

    db.commit()
    db.refresh(report)
    return _build_response(report)


@router.post("/{report_id}/submit", response_model=VisitReportResponse)
def submit_report(report_id: int, db: Session = Depends(get_db), actor: User = Depends(require_rep)):
    report = db.query(VisitReport).filter(VisitReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.representative_id != actor.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if report.status != ReportStatus.draft:
        raise HTTPException(status_code=400, detail="Report already submitted")

    for item in report.items:
        if not item.visited and not item.note:
            raise HTTPException(
                status_code=422,
                detail=f"Note required for unvisited doctor: {item.doctor.name}",
            )

    report.status = ReportStatus.submitted
    report.submitted_at = datetime.utcnow()
    log_action(db, actor.id, "submit_visit_report", "visit_report", report_id)
    db.commit()
    db.refresh(report)
    return _build_response(report)


@router.patch("/{report_id}/review", response_model=VisitReportResponse)
def review_report(
    report_id: int,
    body: VisitReportReview,
    db: Session = Depends(get_db),
    actor: User = Depends(require_manager),
):
    report = db.query(VisitReport).filter(VisitReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != ReportStatus.submitted:
        raise HTTPException(status_code=400, detail="Report not in submitted state")

    report.status = ReportStatus.approved if body.approved else ReportStatus.rejected
    report.manager_note = body.manager_note
    report.reviewed_at = datetime.utcnow()
    report.reviewed_by = actor.id

    action = "approve_visit_report" if body.approved else "reject_visit_report"
    log_action(db, actor.id, action, "visit_report", report_id)
    db.commit()
    db.refresh(report)
    return _build_response(report)
