from typing import Protocol

from app.schemas.job_schema import AtsResult

EDUCATION_RANK = {"high-school": 1, "bachelor": 2, "master": 3, "phd": 4}
WEIGHTS = {"skills": 0.5, "experience": 0.25, "education": 0.15, "location": 0.1}


class JobRequirements(Protocol):
    required_skills: list[str]
    min_experience_years: int
    education_level: str
    location: str


class CandidateFacts(Protocol):
    skills: list[str]
    experience_years: int
    education_level: str | None
    location: str | None


def _round(value: float) -> int:
    return int(value + 0.5)


def compute_ats(job: JobRequirements, profile: CandidateFacts | None) -> AtsResult:
    candidate_skills = {skill.lower() for skill in (profile.skills if profile else [])}
    matched = [skill for skill in job.required_skills if skill.lower() in candidate_skills]
    missing = [skill for skill in job.required_skills if skill.lower() not in candidate_skills]
    skills_score = _round(len(matched) / len(job.required_skills) * 100) if job.required_skills else 100

    years = profile.experience_years if profile else 0
    required_years = job.min_experience_years
    if required_years == 0:
        experience_score = 100
    elif years >= required_years:
        experience_score = min(100, _round(80 + (years - required_years) / required_years * 20))
    else:
        experience_score = _round(years / required_years * 80)

    candidate_rank = EDUCATION_RANK.get(profile.education_level or "", 0) if profile else 0
    meets_education = job.education_level == "any" or candidate_rank >= EDUCATION_RANK[job.education_level]
    education_score = 100 if meets_education else 60

    job_location = job.location.strip().lower()
    candidate_location = (profile.location or "").strip().lower() if profile else ""
    same_place = candidate_location and (candidate_location in job_location or job_location in candidate_location)
    location_score = 100 if "remote" in job_location or same_place else 70

    overall = _round(
        skills_score * WEIGHTS["skills"]
        + experience_score * WEIGHTS["experience"]
        + education_score * WEIGHTS["education"]
        + location_score * WEIGHTS["location"]
    )
    verdict = "strong" if overall >= 80 else "good" if overall >= 65 else "fair" if overall >= 50 else "weak"

    return AtsResult(
        overall=overall,
        verdict=verdict,
        skills_score=skills_score,
        experience_score=experience_score,
        education_score=education_score,
        location_score=location_score,
        matched=matched,
        missing=missing,
    )
