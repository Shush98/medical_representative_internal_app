# Orexis Pharma Representative Management

A professional web application for managing pharmaceutical representatives, doctor visits, expense claims, and approvals.

## Roles

| Role | Capabilities |
|------|-------------|
| **Representative** | Add doctors, file daily visit reports, submit expense claims, download reports |
| **Manager** | Approve/reject doctor additions, visit reports, expense claims; set expense limits per rep per area |
| **Administrator** | Everything above + user CRUD, area CRUD, audit logs |

---

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS (deployed on Vercel)
- **Backend**: FastAPI + SQLAlchemy 2.0 + Alembic (deployed on Railway)
- **Database**: PostgreSQL (Railway managed)
- **Auth**: JWT — access token in memory, refresh token in httpOnly cookie
- **Exports**: Excel (openpyxl) + PDF (ReportLab)

---

## Local Development

### Prerequisites

- Python 3.11+ (3.14 supported via psycopg v3)
- Node.js 18+
- PostgreSQL 14+ running locally

### 1. Clone and set up the backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file and edit it
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://postgres:yourpassword@localhost:5432/orexis_db
SECRET_KEY=your-random-32-byte-hex-string
CORS_ORIGINS=http://localhost:5173
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

Generate a secure secret key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 2. Set up the database

```bash
# Create the database (in psql or pgAdmin):
# CREATE DATABASE orexis_db;

# Run migrations
alembic upgrade head

# Seed initial data (roles + admin user + 4 zones)
python seed.py
```

Default admin credentials after seeding:
- **Email**: `admin@orexis.com`
- **Password**: `Admin@123`

### 3. Start the backend

```bash
uvicorn app.main:app --reload
```

API is available at `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

### 4. Set up and start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend is available at `http://localhost:5173`

The Vite dev server proxies `/api/*` requests to `http://localhost:8000`, so CORS and cookies work seamlessly.

---

## Deployment

### Backend — Railway

1. Create a new Railway project and add a **PostgreSQL** service.
2. Add a new service from your GitHub repo (point to the `backend/` directory).
3. Railway auto-detects Python and uses the `Procfile`:
   ```
   web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
   release: alembic upgrade head
   ```
4. Set these environment variables in Railway:
   ```
   DATABASE_URL   → (Railway provides this automatically from the PostgreSQL service)
   SECRET_KEY     → (generate with: python -c "import secrets; print(secrets.token_hex(32))")
   CORS_ORIGINS   → https://your-app.vercel.app
   ACCESS_TOKEN_EXPIRE_MINUTES → 15
   REFRESH_TOKEN_EXPIRE_DAYS   → 7
   ```
5. After the first deploy, run the seed script via Railway's shell:
   ```bash
   python seed.py
   ```

### Frontend — Vercel

1. Import the repo on Vercel and set the **Root Directory** to `frontend`.
2. Build settings are auto-detected from `package.json`:
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
3. Add an environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```
4. The `vercel.json` in the `frontend/` directory handles SPA routing (all paths → `index.html`).

---

## Project Structure

```
pharma_representative_app/
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app, CORS, router registration
│   │   ├── config.py           # pydantic-settings
│   │   ├── database.py         # SQLAlchemy engine + get_db dependency
│   │   ├── dependencies.py     # get_current_user, RoleChecker
│   │   ├── models/             # ORM models (one file per domain)
│   │   ├── routers/            # Route handlers (auth, users, areas, doctors, ...)
│   │   ├── services/           # Business logic + report generation
│   │   └── utils/              # audit.py helper
│   ├── alembic/                # DB migrations
│   ├── seed.py                 # Initial seed data
│   ├── requirements.txt
│   ├── Procfile                # Railway deployment
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/                # axios client + per-domain API functions
    │   ├── components/
    │   │   ├── layout/         # AppShell, Sidebar, RoleGuard
    │   │   └── shared/         # Modal, Spinner, EmptyState, PageHeader, etc.
    │   ├── pages/
    │   │   ├── auth/           # LoginPage
    │   │   ├── rep/            # DoctorsPage, VisitReportPage, ExpensePage, DownloadPage
    │   │   ├── manager/        # Approval pages, ExpenseLimitsPage
    │   │   └── admin/          # Dashboard, UsersPage, AreasPage, LogsPage
    │   ├── store/              # Zustand auth store
    │   └── utils/              # format helpers
    ├── vercel.json             # SPA rewrite rule
    ├── vite.config.js
    └── package.json
```

---

## Key Business Rules

- **Expense ceiling**: Backend rejects expense report submission (HTTP 422) if `total_amount > expense_limit.max_amount` for that rep + area combination.
- **Visit report validation**: All unvisited doctors must have a note before submission.
- **Doctor approval flow**: Newly added doctors are `pending` — they do not appear in visit report checklists until a manager approves them.
- **Audit logging**: Every create/update/delete of significant entities is recorded in `audit_logs` with the acting user, IP address, and changed data.

---

## API Documentation

With the backend running locally, visit `http://localhost:8000/docs` for the full interactive Swagger UI.
