from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Role, Area, UserArea
from app.schemas.user import UserCreate, UserUpdate, UserResponse, AreaBrief
from app.dependencies import require_admin, require_manager, get_current_user
from app.services.auth_service import get_password_hash
from app.utils.audit import log_action

router = APIRouter(prefix="/users", tags=["users"])


def _build_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role.name,
        is_active=user.is_active,
        created_at=user.created_at,
        areas=[AreaBrief(id=a.id, name=a.name) for a in user.areas],
    )


@router.get("", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [_build_response(u) for u in users]


@router.post("", response_model=UserResponse, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db), actor: User = Depends(require_admin)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    role = db.query(Role).filter(Role.id == body.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    user = User(
        email=body.email,
        password_hash=get_password_hash(body.password),
        full_name=body.full_name,
        phone=body.phone,
        role_id=body.role_id,
    )
    db.add(user)
    db.flush()

    for area_id in body.area_ids or []:
        if db.query(Area).filter(Area.id == area_id).first():
            db.add(UserArea(user_id=user.id, area_id=area_id))

    log_action(db, actor.id, "create_user", "user", user.id, {"email": user.email})
    db.commit()
    db.refresh(user)
    return _build_response(user)


@router.get("/reps", response_model=List[UserResponse])
def list_reps(db: Session = Depends(get_db), _: User = Depends(require_manager)):
    rep_role = db.query(Role).filter(Role.name == "representative").first()
    if not rep_role:
        return []
    users = db.query(User).filter(User.role_id == rep_role.id, User.is_active == True).all()
    return [_build_response(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _build_response(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, body: UserUpdate, db: Session = Depends(get_db), actor: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for field, value in body.model_dump(exclude_none=True, exclude={"area_ids"}).items():
        setattr(user, field, value)

    if body.area_ids is not None:
        db.query(UserArea).filter(UserArea.user_id == user_id).delete()
        for area_id in body.area_ids:
            if db.query(Area).filter(Area.id == area_id).first():
                db.add(UserArea(user_id=user_id, area_id=area_id))

    log_action(db, actor.id, "update_user", "user", user_id)
    db.commit()
    db.refresh(user)
    return _build_response(user)


@router.delete("/{user_id}")
def deactivate_user(user_id: int, db: Session = Depends(get_db), actor: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == actor.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    user.is_active = False
    log_action(db, actor.id, "deactivate_user", "user", user_id)
    db.commit()
    return {"message": "User deactivated"}
