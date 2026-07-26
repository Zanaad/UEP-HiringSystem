# HirePrep

HirePrep is a hiring platform with two user sides:

- Recruiter side: dashboard, jobs, candidate pipeline, settings
- Candidate side: dashboard, jobs, mock interviews, settings

## Project Layout

- `frontend`: React + Vite + TypeScript
- `backend`: FastAPI service

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Backend Migrations

```bash
cd backend
alembic upgrade head
```
