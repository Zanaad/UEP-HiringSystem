from sqlalchemy.orm import Session

from app.models.job import Job
from app.models.user import User
from app.repositories.job_repository import JobRepository
from app.schemas.job_schema import JobCreate, JobPage, JobRead, JobUpdate


class JobService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = JobRepository(db)

    def search(self, query: str | None, employment_type: str | None, page: int, page_size: int) -> JobPage:
        items, total = self.repository.search_active(
            query.strip() if query else None, employment_type, (page - 1) * page_size, page_size
        )
        return JobPage(
            items=[JobRead.model_validate(job) for job in items], total=total, page=page, page_size=page_size
        )

    def list_for_recruiter(self, recruiter: User) -> list[Job]:
        return self.repository.list_by_company(self._company_id(recruiter))

    def create(self, recruiter: User, payload: JobCreate) -> Job:
        job = Job(**payload.model_dump(), company_id=self._company_id(recruiter), created_by=recruiter.id)
        self.db.add(job)
        self.db.commit()
        return self._get_owned(recruiter, job.id)

    def update(self, recruiter: User, job_id: int, payload: JobUpdate) -> Job:
        job = self._get_owned(recruiter, job_id)
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(job, field, value)
        self.db.commit()
        return self._get_owned(recruiter, job_id)

    def _get_owned(self, recruiter: User, job_id: int) -> Job:
        job = self.repository.get_for_company(job_id, self._company_id(recruiter))
        if job is None:
            raise LookupError("Job not found")
        return job

    @staticmethod
    def _company_id(recruiter: User) -> int:
        if recruiter.company_id is None:
            raise ValueError("Your account is not linked to a company")
        return recruiter.company_id
