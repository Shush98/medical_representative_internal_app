from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class AreaBrief(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role_id: int
    area_ids: Optional[List[int]] = []


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None
    area_ids: Optional[List[int]] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str]
    role: str
    is_active: bool
    created_at: datetime
    areas: List[AreaBrief]

    model_config = {"from_attributes": True}
