from pathlib import Path
from uuid import uuid4

from sqlalchemy.orm import Session

from app.config.settings import settings
from app.exceptions import NotFoundError
from app.models.candidate_profile import CandidateProfile
from app.models.user import User
from app.repositories.application_repository import ApplicationRepository
from app.schemas.profile_schema import CandidateProfileRead, CandidateProfileUpdate
from app.services.ats_service import compute_ats

MAX_RESUME_BYTES = 5 * 1024 * 1024
RESUME_TYPES = {
    ".pdf": (b"%PDF-", "application/pdf"),
    ".docx": (b"PK\x03\x04", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
}


def to_profile_read(profile: CandidateProfile | None) -> CandidateProfileRead:
    return CandidateProfileRead.model_validate(profile, from_attributes=True) if profile else CandidateProfileRead()


class ProfileService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, user: User) -> CandidateProfileRead:
        return to_profile_read(self.db.get(CandidateProfile, user.id))

    def update(self, user: User, payload: CandidateProfileUpdate) -> CandidateProfileRead:
        profile = self._get_or_create(user.id)
        for field, value in payload.model_dump(mode="json").items():
            setattr(profile, field, value)
        for application in ApplicationRepository(self.db).list_for_candidate_with_jobs(user.id):
            ats = compute_ats(application.job, profile)
            application.ats, application.ats_score = ats.model_dump(), ats.overall
        self.db.commit()
        return to_profile_read(profile)

    def save_resume(self, user: User, filename: str, extension: str, content: bytes) -> CandidateProfileRead:
        stored_path = f"resumes/{uuid4().hex}{extension}"
        target = Path(settings.upload_dir) / stored_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)

        profile = self._get_or_create(user.id)
        previous = profile.resume_path
        profile.resume_path = stored_path
        profile.resume_filename = Path(filename).name[:255] or f"resume{extension}"
        self.db.commit()
        if previous:
            (Path(settings.upload_dir) / previous).unlink(missing_ok=True)
        return to_profile_read(profile)

    def resume_file(self, user_id: int) -> tuple[Path, str, str]:
        profile = self.db.get(CandidateProfile, user_id)
        path = Path(settings.upload_dir) / profile.resume_path if profile and profile.resume_path else None
        if path is None or not path.is_file():
            raise NotFoundError("Resume not found")
        return path, profile.resume_filename or path.name, RESUME_TYPES[path.suffix][1]

    def _get_or_create(self, user_id: int) -> CandidateProfile:
        profile = self.db.get(CandidateProfile, user_id)
        if profile is None:
            profile = CandidateProfile(user_id=user_id, skills=[], experience_years=0)
            self.db.add(profile)
        return profile
