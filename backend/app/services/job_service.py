from sqlalchemy.orm import Session

from app.exceptions import ConflictError, NotFoundError
from app.models.candidate_profile import CandidateProfile
from app.models.job import Job
from app.models.user import User
from app.repositories.application_repository import ApplicationRepository
from app.repositories.job_repository import JobRepository
from app.schemas.job_schema import JobCreate, JobPage, JobRead, JobSearchItem, JobUpdate
from app.services.ats_service import compute_ats

ATS_FIELDS = {"required_skills", "min_experience_years", "education_level", "location"}


class JobService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = JobRepository(db)
        self.applications = ApplicationRepository(db)

    def search(
        self, query: str | None, employment_type: str | None, page: int, page_size: int, viewer: User | None
    ) -> JobPage:
        jobs, total = self.repository.search_active(
            query.strip() if query else None, employment_type, (page - 1) * page_size, page_size
        )
        job_ids = [job.id for job in jobs]
        counts = self.applications.count_by_job(job_ids)
        items = [
            JobSearchItem.model_validate(job).model_copy(update={"applicant_count": counts.get(job.id, 0)})
            for job in jobs
        ]

        if viewer is not None and viewer.role == "candidate":
            profile = self.db.get(CandidateProfile, viewer.id)
            applied = self.applications.applied_job_ids(viewer.id, job_ids)
            for item, job in zip(items, jobs, strict=True):
                item.match = compute_ats(job, profile)
                item.applied = job.id in applied

        return JobPage(items=items, total=total, page=page, page_size=page_size)

    def list_for_recruiter(self, recruiter: User) -> list[JobRead]:
        return self._with_counts(self.repository.list_by_company(self._company_id(recruiter)))

    def create(self, recruiter: User, payload: JobCreate) -> JobRead:
        job = Job(**payload.model_dump(), company_id=self._company_id(recruiter), created_by=recruiter.id)
        self.db.add(job)
        self.db.commit()
        return self._with_counts([self.get_owned(recruiter, job.id)])[0]

    def update(self, recruiter: User, job_id: int, payload: JobUpdate) -> JobRead:
        job = self.get_owned(recruiter, job_id)
        changes = payload.model_dump(exclude_unset=True)
        for field, value in changes.items():
            setattr(job, field, value)
        if ATS_FIELDS & changes.keys():
            for application in self.applications.list_for_job_with_profiles(job.id):
                ats = compute_ats(job, application.profile)
                application.ats, application.ats_score = ats.model_dump(), ats.overall
        self.db.commit()
        return self._with_counts([self.get_owned(recruiter, job_id)])[0]

    def _with_counts(self, jobs: list[Job]) -> list[JobRead]:
        counts = self.applications.count_by_job([job.id for job in jobs])
        return [
            JobRead.model_validate(job).model_copy(update={"applicant_count": counts.get(job.id, 0)}) for job in jobs
        ]

    def get_owned(self, recruiter: User, job_id: int) -> Job:
        job = self.repository.get_for_company(job_id, self._company_id(recruiter))
        if job is None:
            raise NotFoundError("Job not found")
        return job

    @staticmethod
    def _company_id(recruiter: User) -> int:
        if recruiter.company_id is None:
            raise ConflictError("Your account is not linked to a company")
        return recruiter.company_id
