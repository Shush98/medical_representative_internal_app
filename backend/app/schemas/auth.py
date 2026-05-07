from typing import List
from pydantic import BaseModel, EmailStr
from app.schemas.user import AreaBrief


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserInfo(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    areas: List[AreaBrief] = []


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserInfo


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str
