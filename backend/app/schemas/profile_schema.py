from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, Field, HttpUrl, StringConstraints

from app.schemas.job_schema import Skills

CandidateEducation = Literal["high-school", "bachelor", "master", "phd"]


def _blank_to_none(value: str | None) -> str | None:
    return value or None


OptionalText = Annotated[
    Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)] | None, AfterValidator(_blank_to_none)
]
Phone = Annotated[
    Annotated[str, StringConstraints(strip_whitespace=True, pattern=r"^$|^[+0-9 ()-]{6,30}$")] | None,
    AfterValidator(_blank_to_none),
]


class CandidateProfileUpdate(BaseModel):
    headline: OptionalText = None
    phone: Phone = None
    location: OptionalText = None
    linkedin_url: HttpUrl | None = None
    github_url: HttpUrl | None = None
    portfolio_url: HttpUrl | None = None
    skills: Skills = []
    experience_years: Annotated[int, Field(ge=0, le=50)] = 0
    education_level: CandidateEducation | None = None


class CandidateProfileRead(BaseModel):
    headline: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None
    skills: list[str] = []
    experience_years: int = 0
    education_level: CandidateEducation | None = None
    resume_filename: str | None = None
