from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, StringConstraints

from app.schemas.job_schema import AtsResult, EducationLevel, EmploymentType, JobStatus
from app.schemas.profile_schema import CandidateProfileRead

Stage = Literal["applied", "screening", "interview", "technical", "offer", "hired", "rejected"]


class ApplicationCreate(BaseModel):
    job_id: int
    cover_note: Annotated[str, StringConstraints(strip_whitespace=True, max_length=3000)] | None = None


class StageUpdate(BaseModel):
    stage: Stage


class NoteCreate(BaseModel):
    body: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]


class StageEvent(BaseModel):
    from_stage: Stage | None
    to_stage: Stage
    actor_name: str | None = None
    created_at: datetime


class NoteRead(BaseModel):
    id: int
    body: str
    author_name: str | None
    created_at: datetime


class JobBrief(BaseModel):
    id: int
    title: str
    company_name: str
    department: str
    location: str
    employment_type: EmploymentType
    status: JobStatus
    required_skills: list[str]
    min_experience_years: int
    education_level: EducationLevel


class CandidateBrief(BaseModel):
    id: int
    name: str
    email: str
    headline: str | None
    location: str | None
    experience_years: int
    skills: list[str]


class ApplicationSummary(BaseModel):
    id: int
    stage: Stage
    ats: AtsResult
    created_at: datetime
    updated_at: datetime
    candidate: CandidateBrief


class ApplicationDetail(BaseModel):
    id: int
    stage: Stage
    ats: AtsResult
    cover_note: str | None
    created_at: datetime
    candidate_id: int
    candidate_name: str
    candidate_email: str
    profile: CandidateProfileRead
    job: JobBrief
    events: list[StageEvent]
    notes: list[NoteRead]


class MyApplication(BaseModel):
    id: int
    stage: Stage
    ats: AtsResult
    created_at: datetime
    updated_at: datetime
    job: JobBrief
    events: list[StageEvent]
