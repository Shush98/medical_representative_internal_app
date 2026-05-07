from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(user_id), "role": role, "type": "access", "exp": expire},
        settings.SECRET_KEY,
        algorithm="HS256",
    )


def create_refresh_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": str(user_id), "type": "refresh", "exp": expire},
        settings.SECRET_KEY,
        algorithm="HS256",
    )


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except JWTError:
        return None
