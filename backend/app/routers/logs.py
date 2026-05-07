from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, AuditLog
from app.schemas.log import LogResponse
from app.dependencies import require_admin

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("", response_model=List[LogResponse])
def list_logs(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(AuditLog)
    if user_id:
        q = q.filter(AuditLog.user_id == user_id)
    if action:
        q = q.filter(AuditLog.action.ilike(f"%{action}%"))
    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)

    logs = q.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    return [
        LogResponse(
            id=log.id,
            user_id=log.user_id,
            user_name=log.user.full_name if log.user else None,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            details=log.details,
            ip_address=log.ip_address,
            created_at=log.created_at,
        )
        for log in logs
    ]
