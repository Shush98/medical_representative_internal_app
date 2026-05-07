from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    user_name: Optional[str]
    action: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    details: Optional[dict]
    ip_address: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
