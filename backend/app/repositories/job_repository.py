from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, contains_eager

from app.models.company import Company
from app.models.job import Job


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class JobRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def search_active(
        self, query: str | None, employment_type: str | None, offset: int, limit: int
    ) -> tuple[list[Job], int]:
        filters = [Job.status == "active"]
        if query:
            pattern = f"%{_escape_like(query)}%"
            filters.append(
                or_(
                    *(
                        column.like(pattern, escape="\\")
                        for column in (Job.title, Job.department, Job.location, Company.name)
                    )
                )
            )
        if employment_type:
            filters.append(Job.employment_type == employment_type)

        total = self.db.scalar(select(func.count(Job.id)).join(Job.company).where(*filters)) or 0
        items = self.db.scalars(
            select(Job)
            .join(Job.company)
            .options(contains_eager(Job.company))
            .where(*filters)
            .order_by(Job.created_at.desc(), Job.id.desc())
            .offset(offset)
            .limit(limit)
        ).all()
        return list(items), total

    def list_by_company(self, company_id: int) -> list[Job]:
        return list(
            self.db.scalars(
                select(Job)
                .join(Job.company)
                .options(contains_eager(Job.company))
                .where(Job.company_id == company_id)
                .order_by(Job.created_at.desc(), Job.id.desc())
            ).all()
        )

    def get_for_company(self, job_id: int, company_id: int) -> Job | None:
        return self.db.scalar(
            select(Job)
            .join(Job.company)
            .options(contains_eager(Job.company))
            .where(Job.id == job_id, Job.company_id == company_id)
        )

    def get_active(self, job_id: int) -> Job | None:
        return self.db.scalar(
            select(Job)
            .join(Job.company)
            .options(contains_eager(Job.company))
            .where(Job.id == job_id, Job.status == "active")
        )
