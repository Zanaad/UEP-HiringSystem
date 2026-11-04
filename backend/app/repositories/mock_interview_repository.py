from datetime import datetime

from sqlalchemy import exists, func, or_, select
from sqlalchemy.orm import Session, contains_eager, selectinload

from app.models.application import Application
from app.models.job import Job
from app.models.mock_interview import MockInterviewQuestion, MockInterviewSession


class MockInterviewRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_owned(self, session_id: int, candidate_id: int) -> MockInterviewSession | None:
        return self.db.scalar(
            select(MockInterviewSession)
            .where(MockInterviewSession.id == session_id, MockInterviewSession.candidate_id == candidate_id)
            .options(selectinload(MockInterviewSession.questions))
        )

    def list_for_candidate(self, candidate_id: int, limit: int = 50) -> list[tuple[MockInterviewSession, int, int]]:
        rows = self.db.execute(
            select(
                MockInterviewSession,
                func.count(MockInterviewQuestion.id),
                func.count(MockInterviewQuestion.answer),
            )
            .outerjoin(MockInterviewQuestion, MockInterviewQuestion.session_id == MockInterviewSession.id)
            .where(MockInterviewSession.candidate_id == candidate_id)
            .group_by(MockInterviewSession.id)
            .order_by(MockInterviewSession.created_at.desc(), MockInterviewSession.id.desc())
            .limit(limit)
        ).all()
        return [tuple(row) for row in rows]

    def sessions_since(self, candidate_id: int, since: datetime) -> int:
        return (
            self.db.scalar(
                select(func.count(MockInterviewSession.id)).where(
                    MockInterviewSession.candidate_id == candidate_id, MockInterviewSession.created_at >= since
                )
            )
            or 0
        )

    def answers_since(self, candidate_id: int, since: datetime) -> int:
        return (
            self.db.scalar(
                select(func.count(MockInterviewQuestion.id))
                .join(MockInterviewSession, MockInterviewSession.id == MockInterviewQuestion.session_id)
                .where(MockInterviewSession.candidate_id == candidate_id, MockInterviewQuestion.answered_at >= since)
            )
            or 0
        )

    def job_for_candidate(self, job_id: int, candidate_id: int) -> Job | None:
        applied = exists().where(Application.job_id == Job.id, Application.candidate_id == candidate_id)
        return self.db.scalar(
            select(Job)
            .join(Job.company)
            .options(contains_eager(Job.company))
            .where(Job.id == job_id, or_(Job.status == "active", applied))
        )
