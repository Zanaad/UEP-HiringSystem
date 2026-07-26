# HirePrep

HirePrep is a hiring platform with two user sides:

- Recruiter side: dashboard, jobs, candidate pipeline, settings
- Candidate side: dashboard, jobs, mock interviews, settings

## Project Layout

- `frontend`: React + Vite + TypeScript
- `backend`: FastAPI service

## Quick Start

### Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

### Migrations

```bash
docker compose exec backend alembic upgrade head
```

### Services

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- MySQL: localhost:3306
