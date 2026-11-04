from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.application import Application, ApplicationEvent, ApplicationNote
from app.models.job import Job


class ApplicationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_candidate(self, candidate_id: int) -> list[Application]:
        return list(
            self.db.scalars(
                select(Application)
                .where(Application.candidate_id == candidate_id)
                .options(joinedload(Application.job).joinedload(Job.company), selectinload(Application.events))
                .order_by(Application.created_at.desc(), Application.id.desc())
            ).all()
        )

    def list_for_job(self, job_id: int) -> list[Application]:
        return list(
            self.db.scalars(
                select(Application)
                .where(Application.job_id == job_id)
                .options(joinedload(Application.candidate), selectinload(Application.profile))
                .order_by(Application.ats_score.desc(), Application.created_at)
            ).all()
        )

    def list_for_job_with_profiles(self, job_id: int) -> list[Application]:
        return list(
            self.db.scalars(
                select(Application).where(Application.job_id == job_id).options(selectinload(Application.profile))
            ).all()
        )

    def list_for_candidate_with_jobs(self, candidate_id: int) -> list[Application]:
        return list(
            self.db.scalars(
                select(Application).where(Application.candidate_id == candidate_id).options(joinedload(Application.job))
            ).all()
        )

    def get_for_company(self, application_id: int, company_id: int) -> Application | None:
        return self.db.scalar(
            select(Application)
            .join(Application.job)
            .where(Application.id == application_id, Job.company_id == company_id)
            .options(
                joinedload(Application.job).joinedload(Job.company),
                joinedload(Application.candidate),
                selectinload(Application.profile),
                selectinload(Application.events).joinedload(ApplicationEvent.actor),
                selectinload(Application.notes).joinedload(ApplicationNote.author),
            )
        )

    def get_light_for_company(self, application_id: int, company_id: int) -> Application | None:
        return self.db.scalar(
            select(Application)
            .join(Application.job)
            .where(Application.id == application_id, Job.company_id == company_id)
        )

    def get_with_job(self, application_id: int, candidate_id: int) -> Application | None:
        return self.db.scalar(
            select(Application)
            .where(Application.id == application_id, Application.candidate_id == candidate_id)
            .options(joinedload(Application.job).joinedload(Job.company), selectinload(Application.events))
        )

    def count_by_job(self, job_ids: list[int]) -> dict[int, int]:
        if not job_ids:
            return {}
        rows = self.db.execute(
            select(Application.job_id, func.count(Application.id))
            .where(Application.job_id.in_(job_ids))
            .group_by(Application.job_id)
        ).all()
        return dict(rows)

    def applied_job_ids(self, candidate_id: int, job_ids: list[int]) -> set[int]:
        if not job_ids:
            return set()
        return set(
            self.db.scalars(
                select(Application.job_id).where(
                    Application.candidate_id == candidate_id, Application.job_id.in_(job_ids)
                )
            ).all()
        )
