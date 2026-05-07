from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.services.auth_service import decode_token

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id), User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


class RoleChecker:
    def __init__(self, *roles: str):
        self.roles = roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.name not in self.roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(self.roles)}",
            )
        return current_user


require_any = RoleChecker("representative", "manager", "administrator")
require_manager = RoleChecker("manager", "administrator")
require_admin = RoleChecker("administrator")
