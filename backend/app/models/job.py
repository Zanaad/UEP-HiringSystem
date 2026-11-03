from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.company import Company


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        Index("ix_jobs_status_created_at", "status", "created_at"),
        Index("ix_jobs_company_id_created_at", "company_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    department: Mapped[str] = mapped_column(String(80), nullable=False)
    location: Mapped[str] = mapped_column(String(120), nullable=False)
    employment_type: Mapped[str] = mapped_column(String(20), nullable=False)
    salary_range: Mapped[str | None] = mapped_column(String(60))
    description: Mapped[str] = mapped_column(Text, nullable=False)
    required_skills: Mapped[list[str]] = mapped_column(JSON, nullable=False)
    min_experience_years: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    education_level: Mapped[str] = mapped_column(String(20), nullable=False, default="any")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=func.now()
    )

    company: Mapped[Company] = relationship(lazy="raise")

    @property
    def company_name(self) -> str:
        return self.company.name
