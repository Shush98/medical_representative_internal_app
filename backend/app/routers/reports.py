from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response as FastAPIResponse
from sqlalchemy.orm import Session
from datetime import date
from app.database import get_db
from app.models import User, VisitReport, ExpenseReport
from app.dependencies import get_current_user
from app.services.report_generator import (
    generate_visit_excel, generate_expense_excel,
    generate_visit_pdf, generate_expense_pdf,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/download")
def download_report(
    type: str = Query(..., description="visit or expense"),
    format: str = Query(..., description="xlsx or pdf"),
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
    db: Session = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    if type not in ("visit", "expense"):
        raise HTTPException(status_code=400, detail="type must be 'visit' or 'expense'")
    if format not in ("xlsx", "pdf"):
        raise HTTPException(status_code=400, detail="format must be 'xlsx' or 'pdf'")

    if type == "visit":
        reports = db.query(VisitReport).filter(
            VisitReport.representative_id == actor.id,
            VisitReport.report_date >= from_date,
            VisitReport.report_date <= to_date,
        ).order_by(VisitReport.report_date).all()

        if format == "xlsx":
            content = generate_visit_excel(reports, actor.full_name)
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"visit_report_{from_date}_{to_date}.xlsx"
        else:
            content = generate_visit_pdf(reports, actor.full_name)
            media_type = "application/pdf"
            filename = f"visit_report_{from_date}_{to_date}.pdf"
    else:
        reports = db.query(ExpenseReport).filter(
            ExpenseReport.representative_id == actor.id,
            ExpenseReport.report_date >= from_date,
            ExpenseReport.report_date <= to_date,
        ).order_by(ExpenseReport.report_date).all()

        if format == "xlsx":
            content = generate_expense_excel(reports, actor.full_name)
            media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            filename = f"expense_report_{from_date}_{to_date}.xlsx"
        else:
            content = generate_expense_pdf(reports, actor.full_name)
            media_type = "application/pdf"
            filename = f"expense_report_{from_date}_{to_date}.pdf"

    return FastAPIResponse(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
