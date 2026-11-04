from datetime import datetime

from pydantic import BaseModel

from app.schemas.application_schema import Stage


class FunnelStep(BaseModel):
    stage: Stage
    count: int


class MonthPoint(BaseModel):
    month: str
    applications: int
    hires: int


class ActivityItem(BaseModel):
    application_id: int
    candidate_name: str
    job_title: str
    from_stage: Stage | None
    to_stage: Stage
    actor_name: str | None
    created_at: datetime


class TopMatch(BaseModel):
    application_id: int
    candidate_name: str
    job_title: str
    stage: Stage
    ats_score: int


class RecruiterStats(BaseModel):
    active_jobs: int
    total_candidates: int
    interviewing: int
    hires_this_month: int
    funnel: list[FunnelStep]
    trend: list[MonthPoint]
    recent_activity: list[ActivityItem]
    top_matches: list[TopMatch]
