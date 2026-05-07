from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Area, ExpenseLimit
from app.schemas.expense import ExpenseLimitCreate, ExpenseLimitResponse
from app.dependencies import require_manager, get_current_user
from app.utils.audit import log_action

router = APIRouter(prefix="/expense-limits", tags=["expense-limits"])


def _build_response(limit: ExpenseLimit) -> ExpenseLimitResponse:
    return ExpenseLimitResponse(
        id=limit.id,
        area_id=limit.area_id,
        area_name=limit.area.name,
        representative_id=limit.representative_id,
        representative_name=limit.representative.full_name,
        max_amount=limit.max_amount,
        updated_at=limit.updated_at,
    )


@router.get("", response_model=List[ExpenseLimitResponse])
def list_limits(db: Session = Depends(get_db), actor: User = Depends(require_manager)):
    return [_build_response(l) for l in db.query(ExpenseLimit).all()]


@router.get("/my/{area_id}", response_model=ExpenseLimitResponse)
def get_my_limit(area_id: int, db: Session = Depends(get_db), actor: User = Depends(get_current_user)):
    limit = db.query(ExpenseLimit).filter(
        ExpenseLimit.area_id == area_id,
        ExpenseLimit.representative_id == actor.id,
    ).first()
    if not limit:
        raise HTTPException(status_code=404, detail="No limit set for this area")
    return _build_response(limit)


@router.post("", response_model=ExpenseLimitResponse, status_code=201)
def upsert_limit(body: ExpenseLimitCreate, db: Session = Depends(get_db), actor: User = Depends(require_manager)):
    existing = db.query(ExpenseLimit).filter(
        ExpenseLimit.area_id == body.area_id,
        ExpenseLimit.representative_id == body.representative_id,
    ).first()

    if existing:
        existing.max_amount = body.max_amount
        existing.set_by = actor.id
        log_action(db, actor.id, "update_expense_limit", "expense_limit", existing.id)
        db.commit()
        db.refresh(existing)
        return _build_response(existing)

    limit = ExpenseLimit(
        area_id=body.area_id,
        representative_id=body.representative_id,
        max_amount=body.max_amount,
        set_by=actor.id,
    )
    db.add(limit)
    log_action(db, actor.id, "create_expense_limit", "expense_limit")
    db.commit()
    db.refresh(limit)
    return _build_response(limit)


@router.delete("/{limit_id}")
def delete_limit(limit_id: int, db: Session = Depends(get_db), actor: User = Depends(require_manager)):
    limit = db.query(ExpenseLimit).filter(ExpenseLimit.id == limit_id).first()
    if not limit:
        raise HTTPException(status_code=404, detail="Limit not found")
    db.delete(limit)
    log_action(db, actor.id, "delete_expense_limit", "expense_limit", limit_id)
    db.commit()
    return {"message": "Limit removed"}
