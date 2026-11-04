from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_roles
from app.models.user import User
from app.schemas.profile_schema import CandidateProfileRead, CandidateProfileUpdate
from app.services.profile_service import MAX_RESUME_BYTES, RESUME_TYPES, ProfileService

router = APIRouter(prefix="/me", tags=["profile"])
candidate_only = require_roles("candidate")


def resume_response(path: Path, filename: str, media_type: str) -> FileResponse:
    return FileResponse(path, filename=filename, media_type=media_type, headers={"X-Content-Type-Options": "nosniff"})


@router.get("/profile", response_model=CandidateProfileRead)
def get_profile(db: Session = Depends(get_db), user: User = Depends(candidate_only)) -> CandidateProfileRead:
    return ProfileService(db).get(user)


@router.put("/profile", response_model=CandidateProfileRead)
def update_profile(
    payload: CandidateProfileUpdate, db: Session = Depends(get_db), user: User = Depends(candidate_only)
) -> CandidateProfileRead:
    return ProfileService(db).update(user, payload)


@router.put("/resume", response_model=CandidateProfileRead)
def upload_resume(
    file: UploadFile, db: Session = Depends(get_db), user: User = Depends(candidate_only)
) -> CandidateProfileRead:
    extension = Path(file.filename or "").suffix.lower()
    content = file.file.read(MAX_RESUME_BYTES + 1)
    if len(content) > MAX_RESUME_BYTES:
        raise HTTPException(status_code=413, detail="Resume must be 5 MB or smaller")
    if extension not in RESUME_TYPES or not content.startswith(RESUME_TYPES[extension][0]):
        raise HTTPException(status_code=415, detail="Upload a PDF or DOCX file")
    return ProfileService(db).save_resume(user, file.filename or "", extension, content)


@router.get("/resume")
def download_resume(db: Session = Depends(get_db), user: User = Depends(candidate_only)) -> FileResponse:
    return resume_response(*ProfileService(db).resume_file(user.id))
