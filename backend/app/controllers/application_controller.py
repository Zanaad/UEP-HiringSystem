from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.controllers.profile_controller import resume_response
from app.database.connection import get_db
from app.dependencies.auth import require_roles
from app.models.user import User
from app.schemas.application_schema import (
    ApplicationCreate,
    ApplicationDetail,
    ApplicationSummary,
    MyApplication,
    NoteCreate,
    NoteRead,
    StageUpdate,
)
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["applications"])
candidate_only = require_roles("candidate")
recruiter_only = require_roles("recruiter")


@router.post("", response_model=MyApplication, status_code=201)
def apply(payload: ApplicationCreate, db: Session = Depends(get_db), user: User = Depends(candidate_only)):
    return ApplicationService(db).apply(user, payload)


@router.get("/mine", response_model=list[MyApplication])
def my_applications(db: Session = Depends(get_db), user: User = Depends(candidate_only)):
    return ApplicationService(db).list_mine(user)


@router.get("", response_model=list[ApplicationSummary])
def list_for_job(job_id: int = Query(...), db: Session = Depends(get_db), user: User = Depends(recruiter_only)):
    return ApplicationService(db).list_for_job(user, job_id)


@router.get("/{application_id}", response_model=ApplicationDetail)
def get_application(application_id: int, db: Session = Depends(get_db), user: User = Depends(recruiter_only)):
    return ApplicationService(db).get_detail(user, application_id)


@router.patch("/{application_id}/status", response_model=ApplicationDetail)
def update_status(
    application_id: int, payload: StageUpdate, db: Session = Depends(get_db), user: User = Depends(recruiter_only)
):
    return ApplicationService(db).update_stage(user, application_id, payload.stage)


@router.post("/{application_id}/notes", response_model=NoteRead, status_code=201)
def add_note(
    application_id: int, payload: NoteCreate, db: Session = Depends(get_db), user: User = Depends(recruiter_only)
):
    return ApplicationService(db).add_note(user, application_id, payload.body)


@router.get("/{application_id}/resume")
def download_resume(
    application_id: int, db: Session = Depends(get_db), user: User = Depends(recruiter_only)
) -> FileResponse:
    return resume_response(*ApplicationService(db).resume_file(user, application_id))
