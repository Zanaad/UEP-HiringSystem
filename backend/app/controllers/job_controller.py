from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import get_optional_user, require_roles
from app.models.user import User
from app.schemas.job_schema import EmploymentType, JobCreate, JobPage, JobRead, JobUpdate
from app.services.job_service import JobService

router = APIRouter(tags=["jobs"])
recruiter_only = require_roles("recruiter")


@router.get("/jobs", response_model=JobPage)
def search_jobs(
    q: str | None = Query(default=None, max_length=100),
    employment_type: EmploymentType | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    viewer: User | None = Depends(get_optional_user),
) -> JobPage:
    return JobService(db).search(q, employment_type, page, page_size, viewer)


@router.get("/recruiter/jobs", response_model=list[JobRead])
def list_my_jobs(db: Session = Depends(get_db), recruiter: User = Depends(recruiter_only)) -> list[JobRead]:
    return JobService(db).list_for_recruiter(recruiter)


@router.post("/jobs", response_model=JobRead, status_code=201)
def create_job(payload: JobCreate, db: Session = Depends(get_db), recruiter: User = Depends(recruiter_only)) -> JobRead:
    return JobService(db).create(recruiter, payload)


@router.patch("/jobs/{job_id}", response_model=JobRead)
def update_job(
    job_id: int, payload: JobUpdate, db: Session = Depends(get_db), recruiter: User = Depends(recruiter_only)
) -> JobRead:
    return JobService(db).update(recruiter, job_id, payload)
