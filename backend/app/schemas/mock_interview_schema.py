from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

Track = Literal["behavioral", "frontend", "product", "system-design"]


class MockInterviewStart(BaseModel):
    job_id: int | None = None
    track: Track | None = None
    num_questions: int = Field(default=5, ge=3, le=8)

    @model_validator(mode="after")
    def one_source(self) -> "MockInterviewStart":
        if (self.job_id is None) == (self.track is None):
            raise ValueError("Choose either a job or a practice track")
        return self


class AnswerSubmit(BaseModel):
    question_id: int
    answer: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4000)]


class QuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    position: int
    category: str
    question: str
    tip: str
    answer: str | None
    score: int | None
    strengths: list[str] | None
    improvements: list[str] | None
    suggestion: str | None
    answered_at: datetime | None


class SessionSummary(BaseModel):
    id: int
    title: str
    track: Track | None
    job_id: int | None
    status: Literal["in_progress", "completed"]
    overall_score: int | None
    ai_generated: bool
    question_count: int
    answered_count: int
    created_at: datetime


class SessionRead(BaseModel):
    id: int
    title: str
    track: Track | None
    job_id: int | None
    status: Literal["in_progress", "completed"]
    overall_score: int | None
    ai_generated: bool
    ai_feedback_enabled: bool
    created_at: datetime
    completed_at: datetime | None
    questions: list[QuestionRead]
