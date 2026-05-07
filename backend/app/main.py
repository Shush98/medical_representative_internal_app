from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, users, areas, doctors, visit_reports, expense_reports, expense_limits, reports, logs

app = FastAPI(
    title="Orexis Pharma — Representative Management API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [auth.router, users.router, areas.router, doctors.router,
               visit_reports.router, expense_reports.router, expense_limits.router,
               reports.router, logs.router]:
    app.include_router(router, prefix="/api")


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "service": "Orexis API v1"}
