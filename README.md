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
# set SECRET_KEY in .env (min 32 chars), e.g. with: openssl rand -hex 32
docker compose up --build
```

### Backend checks

```bash
cd backend
pip install -r requirements-dev.txt
ruff check app tests migrations
DATABASE_URL=sqlite:///./test.db SECRET_KEY=local-test-secret-key-at-least-32-chars pytest -q
```

### Migrations

```bash
docker compose exec backend alembic upgrade head
```

### Services

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- MySQL: localhost:3306
