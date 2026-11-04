from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class MockInterviewSession(Base):
    __tablename__ = "mock_interview_sessions"
    __table_args__ = (Index("ix_mock_sessions_candidate_id_created_at", "candidate_id", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id: Mapped[int | None] = mapped_column(ForeignKey("jobs.id", ondelete="SET NULL"))
    track: Mapped[str | None] = mapped_column(String(40))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="in_progress")
    overall_score: Mapped[int | None] = mapped_column(Integer)
    llm_provider: Mapped[str] = mapped_column(String(20), nullable=False)
    llm_model: Mapped[str] = mapped_column(String(80), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    questions: Mapped[list["MockInterviewQuestion"]] = relationship(
        order_by="MockInterviewQuestion.position", cascade="all, delete-orphan", lazy="raise"
    )


class MockInterviewQuestion(Base):
    __tablename__ = "mock_interview_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("mock_interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    tip: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str | None] = mapped_column(Text)
    score: Mapped[int | None] = mapped_column(Integer)
    strengths: Mapped[list[str] | None] = mapped_column(JSON)
    improvements: Mapped[list[str] | None] = mapped_column(JSON)
    suggestion: Mapped[str | None] = mapped_column(Text)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime)
