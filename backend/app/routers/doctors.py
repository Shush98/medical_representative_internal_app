from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import User, Doctor, DoctorStatus
from app.schemas.doctor import DoctorCreate, DoctorReview, DoctorResponse
from app.dependencies import get_current_user, require_manager, RoleChecker
from app.utils.audit import log_action

router = APIRouter(prefix="/doctors", tags=["doctors"])

require_rep = RoleChecker("representative", "manager", "administrator")


def _build_response(d: Doctor) -> DoctorResponse:
    return DoctorResponse(
        id=d.id,
        name=d.name,
        speciality=d.speciality,
        phone=d.phone,
        address=d.address,
        area_id=d.area_id,
        area_name=d.area.name,
        added_by=d.added_by,
        added_by_name=d.adder.full_name,
        status=d.status,
        rejection_note=d.rejection_note,
        approved_by=d.approved_by,
        created_at=d.created_at,
    )


@router.get("", response_model=List[DoctorResponse])
def list_doctors(
    area_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Doctor).options(joinedload(Doctor.adder), joinedload(Doctor.area))

    if current_user.role.name == "representative":
        rep_area_ids = [a.id for a in current_user.areas]
        q = q.filter(Doctor.area_id.in_(rep_area_ids), Doctor.added_by == current_user.id)

    if area_id:
        q = q.filter(Doctor.area_id == area_id)
    if status:
        q = q.filter(Doctor.status == status)

    return [_build_response(d) for d in q.order_by(Doctor.created_at.desc()).all()]


@router.post("", response_model=DoctorResponse, status_code=201)
def add_doctor(body: DoctorCreate, db: Session = Depends(get_db), actor: User = Depends(require_rep)):
    if actor.role.name == "representative":
        rep_area_ids = [a.id for a in actor.areas]
        if body.area_id not in rep_area_ids:
            raise HTTPException(status_code=403, detail="You are not assigned to this area")

    doctor = Doctor(
        name=body.name,
        speciality=body.speciality,
        phone=body.phone,
        address=body.address,
        area_id=body.area_id,
        added_by=actor.id,
        status=DoctorStatus.pending,
    )
    db.add(doctor)
    log_action(db, actor.id, "add_doctor", "doctor", details={"name": body.name})
    db.commit()
    db.refresh(doctor)
    return _build_response(doctor)


@router.patch("/{doctor_id}/review", response_model=DoctorResponse)
def review_doctor(
    doctor_id: int,
    body: DoctorReview,
    db: Session = Depends(get_db),
    actor: User = Depends(require_manager),
):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    if doctor.status != DoctorStatus.pending:
        raise HTTPException(status_code=400, detail="Doctor already reviewed")

    if body.approved:
        doctor.status = DoctorStatus.approved
        doctor.approved_by = actor.id
        action = "approve_doctor"
    else:
        if not body.rejection_note:
            raise HTTPException(status_code=422, detail="Rejection note is required")
        doctor.status = DoctorStatus.rejected
        doctor.rejection_note = body.rejection_note
        action = "reject_doctor"

    log_action(db, actor.id, action, "doctor", doctor_id)
    db.commit()
    db.refresh(doctor)
    return _build_response(doctor)
