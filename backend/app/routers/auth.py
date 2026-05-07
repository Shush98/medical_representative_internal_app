from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas.auth import LoginRequest, LoginResponse, RefreshResponse, UserInfo
from app.services.auth_service import verify_password, create_access_token, create_refresh_token, decode_token
from app.dependencies import get_current_user
from app.config import settings
from app.utils.audit import log_action

router = APIRouter(prefix="/auth", tags=["auth"])

_IS_DEV = "localhost" in settings.CORS_ORIGINS


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, response: Response, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email, User.is_active == True).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(user.id, user.role.name)
    refresh_token = create_refresh_token(user.id)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not _IS_DEV,
        samesite="lax" if _IS_DEV else "none",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/auth",
    )

    log_action(db, user.id, "login", ip_address=request.client.host if request.client else None)
    db.commit()

    from app.schemas.user import AreaBrief
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserInfo(
            id=user.id, email=user.email, full_name=user.full_name, role=user.role.name,
            areas=[AreaBrief(id=a.id, name=a.name) for a in user.areas],
        ),
    )


@router.post("/refresh", response_model=RefreshResponse)
def refresh(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token provided")

    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == int(payload["sub"]), User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return RefreshResponse(access_token=create_access_token(user.id, user.role.name), token_type="bearer")


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("refresh_token", path="/api/auth")
    return {"message": "Logged out"}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.name,
        "phone": current_user.phone,
        "areas": [{"id": a.id, "name": a.name} for a in current_user.areas],
    }
