from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, StringConstraints, model_validator

EmploymentType = Literal["full-time", "part-time", "contract", "internship"]
EducationLevel = Literal["any", "high-school", "bachelor", "master", "phd"]
JobStatus = Literal["draft", "active", "closed"]

MAX_SKILLS = 20


def _clean_skills(skills: list[str]) -> list[str]:
    cleaned: dict[str, str] = {}
    for skill in skills:
        skill = skill.strip()
        if skill:
            cleaned.setdefault(skill.lower(), skill)
    if len(cleaned) > MAX_SKILLS:
        raise ValueError(f"At most {MAX_SKILLS} skills are allowed")
    return list(cleaned.values())


Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=120)]
Department = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=80)]
Location = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=120)]
SalaryRange = Annotated[str, StringConstraints(strip_whitespace=True, max_length=60)]
Description = Annotated[str, StringConstraints(strip_whitespace=True, min_length=20, max_length=5000)]
Skills = Annotated[
    list[Annotated[str, StringConstraints(max_length=40)]], Field(max_length=50), AfterValidator(_clean_skills)
]
ExperienceYears = Annotated[int, Field(ge=0, le=50)]


class JobCreate(BaseModel):
    title: Title
    department: Department
    location: Location
    employment_type: EmploymentType
    salary_range: SalaryRange | None = None
    description: Description
    required_skills: Skills = []
    min_experience_years: ExperienceYears = 0
    education_level: EducationLevel = "any"
    status: Literal["draft", "active"] = "draft"


class JobUpdate(BaseModel):
    title: Title | None = None
    department: Department | None = None
    location: Location | None = None
    employment_type: EmploymentType | None = None
    salary_range: SalaryRange | None = None
    description: Description | None = None
    required_skills: Skills | None = None
    min_experience_years: ExperienceYears | None = None
    education_level: EducationLevel | None = None
    status: JobStatus | None = None

    @model_validator(mode="after")
    def reject_nulls(self) -> "JobUpdate":
        # Only salary_range may be cleared; other columns are required.
        for field in self.model_fields_set - {"salary_range"}:
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class AtsResult(BaseModel):
    overall: int
    verdict: Literal["strong", "good", "fair", "weak"]
    skills_score: int
    experience_score: int
    education_score: int
    location_score: int
    matched: list[str]
    missing: list[str]


class JobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_name: str
    title: str
    department: str
    location: str
    employment_type: EmploymentType
    salary_range: str | None
    description: str
    required_skills: list[str]
    min_experience_years: int
    education_level: EducationLevel
    status: JobStatus
    created_at: datetime
    updated_at: datetime
    applicant_count: int = 0


class JobSearchItem(JobRead):
    match: AtsResult | None = None
    applied: bool = False


class JobPage(BaseModel):
    items: list[JobSearchItem]
    total: int
    page: int
    page_size: int
