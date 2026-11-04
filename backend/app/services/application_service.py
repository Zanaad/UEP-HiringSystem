from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions import ConflictError, NotFoundError
from app.models.application import Application, ApplicationEvent, ApplicationNote
from app.models.candidate_profile import CandidateProfile
from app.models.job import Job
from app.models.user import User
from app.repositories.application_repository import ApplicationRepository
from app.repositories.job_repository import JobRepository
from app.schemas.application_schema import (
    ApplicationCreate,
    ApplicationDetail,
    ApplicationSummary,
    CandidateBrief,
    JobBrief,
    MyApplication,
    NoteRead,
    StageEvent,
)
from app.services.ats_service import compute_ats
from app.services.job_service import JobService
from app.services.profile_service import ProfileService, to_profile_read


def _job_brief(job: Job) -> JobBrief:
    return JobBrief.model_validate(job, from_attributes=True)


class ApplicationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = ApplicationRepository(db)

    def apply(self, candidate: User, payload: ApplicationCreate) -> MyApplication:
        job = JobRepository(self.db).get_active(payload.job_id)
        if job is None:
            raise NotFoundError("Job not found or no longer accepting applications")

        ats = compute_ats(job, self.db.get(CandidateProfile, candidate.id))
        application = Application(
            job_id=job.id,
            candidate_id=candidate.id,
            stage="applied",
            ats=ats.model_dump(),
            ats_score=ats.overall,
            cover_note=payload.cover_note or None,
            events=[ApplicationEvent(from_stage=None, to_stage="applied", changed_by=candidate.id)],
        )
        self.db.add(application)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError("You have already applied to this job") from exc
        return self._mine(self.repository.get_with_job(application.id, candidate.id))

    def list_mine(self, candidate: User) -> list[MyApplication]:
        return [self._mine(application) for application in self.repository.list_for_candidate(candidate.id)]

    def list_for_job(self, recruiter: User, job_id: int) -> list[ApplicationSummary]:
        JobService(self.db).get_owned(recruiter, job_id)
        return [self._summary(application) for application in self.repository.list_for_job(job_id)]

    def get_detail(self, recruiter: User, application_id: int) -> ApplicationDetail:
        return self._detail(self._owned(recruiter, application_id))

    def update_stage(self, recruiter: User, application_id: int, stage: str) -> ApplicationDetail:
        application = self._owned(recruiter, application_id)
        if application.stage != stage:
            application.events.append(
                ApplicationEvent(from_stage=application.stage, to_stage=stage, changed_by=recruiter.id)
            )
            application.stage = stage
            self.db.commit()
            application = self._owned(recruiter, application_id)
        return self._detail(application)

    def add_note(self, recruiter: User, application_id: int, body: str) -> NoteRead:
        application = self.repository.get_light_for_company(application_id, self._company_id(recruiter))
        if application is None:
            raise NotFoundError("Application not found")
        note = ApplicationNote(application_id=application.id, author_id=recruiter.id, body=body)
        self.db.add(note)
        self.db.commit()
        return NoteRead(id=note.id, body=note.body, author_name=recruiter.name, created_at=note.created_at)

    def resume_file(self, recruiter: User, application_id: int):
        application = self.repository.get_light_for_company(application_id, self._company_id(recruiter))
        if application is None:
            raise NotFoundError("Application not found")
        return ProfileService(self.db).resume_file(application.candidate_id)

    def _owned(self, recruiter: User, application_id: int) -> Application:
        application = self.repository.get_for_company(application_id, self._company_id(recruiter))
        if application is None:
            raise NotFoundError("Application not found")
        return application

    @staticmethod
    def _company_id(recruiter: User) -> int:
        if recruiter.company_id is None:
            raise ConflictError("Your account is not linked to a company")
        return recruiter.company_id

    @staticmethod
    def _mine(application: Application) -> MyApplication:
        return MyApplication(
            id=application.id,
            stage=application.stage,
            ats=application.ats,
            created_at=application.created_at,
            updated_at=application.updated_at,
            job=_job_brief(application.job),
            events=[
                StageEvent(from_stage=event.from_stage, to_stage=event.to_stage, created_at=event.created_at)
                for event in application.events
            ],
        )

    @staticmethod
    def _summary(application: Application) -> ApplicationSummary:
        profile = application.profile
        return ApplicationSummary(
            id=application.id,
            stage=application.stage,
            ats=application.ats,
            created_at=application.created_at,
            updated_at=application.updated_at,
            candidate=CandidateBrief(
                id=application.candidate.id,
                name=application.candidate.name,
                email=application.candidate.email,
                headline=profile.headline if profile else None,
                location=profile.location if profile else None,
                experience_years=profile.experience_years if profile else 0,
                skills=profile.skills if profile else [],
            ),
        )

    @staticmethod
    def _detail(application: Application) -> ApplicationDetail:
        return ApplicationDetail(
            id=application.id,
            stage=application.stage,
            ats=application.ats,
            cover_note=application.cover_note,
            created_at=application.created_at,
            candidate_id=application.candidate.id,
            candidate_name=application.candidate.name,
            candidate_email=application.candidate.email,
            profile=to_profile_read(application.profile),
            job=_job_brief(application.job),
            events=[
                StageEvent(
                    from_stage=event.from_stage,
                    to_stage=event.to_stage,
                    actor_name=event.actor.name if event.actor else None,
                    created_at=event.created_at,
                )
                for event in application.events
            ],
            notes=[
                NoteRead(
                    id=note.id,
                    body=note.body,
                    author_name=note.author.name if note.author else None,
                    created_at=note.created_at,
                )
                for note in application.notes
            ],
        )
