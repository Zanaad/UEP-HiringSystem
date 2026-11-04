from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func, text
from sqlalchemy.orm import Mapped, foreign, mapped_column, relationship

from app.database.base import Base
from app.models.candidate_profile import CandidateProfile
from app.models.job import Job
from app.models.user import User


class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("job_id", "candidate_id", name="uq_applications_job_candidate"),
        Index("ix_applications_candidate_id_created_at", "candidate_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    stage: Mapped[str] = mapped_column(String(20), nullable=False, default="applied")
    ats_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ats: Mapped[dict] = mapped_column(JSON, nullable=False)
    cover_note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=func.now()
    )

    job: Mapped[Job] = relationship(lazy="raise")
    candidate: Mapped[User] = relationship(lazy="raise")
    profile: Mapped[CandidateProfile | None] = relationship(
        primaryjoin=lambda: Application.candidate_id == foreign(CandidateProfile.user_id),
        viewonly=True,
        lazy="raise",
    )
    events: Mapped[list["ApplicationEvent"]] = relationship(
        order_by="ApplicationEvent.id", cascade="all, delete-orphan", lazy="raise"
    )
    notes: Mapped[list["ApplicationNote"]] = relationship(
        order_by="ApplicationNote.id.desc()", cascade="all, delete-orphan", lazy="raise"
    )


class ApplicationEvent(Base):
    __tablename__ = "application_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    from_stage: Mapped[str | None] = mapped_column(String(20))
    to_stage: Mapped[str] = mapped_column(String(20), nullable=False)
    changed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    actor: Mapped[User | None] = relationship(lazy="raise")


class ApplicationNote(Base):
    __tablename__ = "application_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True
    )
    author_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))

    author: Mapped[User | None] = relationship(lazy="raise")
