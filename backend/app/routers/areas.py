from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Area
from app.schemas.area import AreaCreate, AreaUpdate, AreaResponse
from app.dependencies import require_admin, get_current_user
from app.utils.audit import log_action

router = APIRouter(prefix="/areas", tags=["areas"])


@router.get("", response_model=List[AreaResponse])
def list_areas(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Area).order_by(Area.name).all()


@router.post("", response_model=AreaResponse, status_code=201)
def create_area(body: AreaCreate, db: Session = Depends(get_db), actor: User = Depends(require_admin)):
    area = Area(name=body.name, description=body.description, created_by=actor.id)
    db.add(area)
    log_action(db, actor.id, "create_area", "area", details={"name": body.name})
    db.commit()
    db.refresh(area)
    return area


@router.put("/{area_id}", response_model=AreaResponse)
def update_area(area_id: int, body: AreaUpdate, db: Session = Depends(get_db), actor: User = Depends(require_admin)):
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(area, field, value)
    log_action(db, actor.id, "update_area", "area", area_id)
    db.commit()
    db.refresh(area)
    return area


@router.delete("/{area_id}")
def delete_area(area_id: int, db: Session = Depends(get_db), actor: User = Depends(require_admin)):
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Area not found")
    db.delete(area)
    log_action(db, actor.id, "delete_area", "area", area_id)
    db.commit()
    return {"message": "Area deleted"}
