from types import SimpleNamespace

from app.services.ats_service import compute_ats


def job(**overrides):
    values = {
        "required_skills": ["Python", "SQL", "Docker", "AWS"],
        "min_experience_years": 4,
        "education_level": "bachelor",
        "location": "Prishtina",
    }
    return SimpleNamespace(**{**values, **overrides})


def profile(**overrides):
    values = {
        "skills": ["python", "SQL", "Docker", "aws"],
        "experience_years": 4,
        "education_level": "master",
        "location": "Prishtina, Kosovo",
    }
    return SimpleNamespace(**{**values, **overrides})


def test_full_match_is_strong():
    result = compute_ats(job(), profile())
    assert result.overall == 95
    assert result.verdict == "strong"
    assert result.missing == []


def test_partial_match_breakdown():
    result = compute_ats(
        job(), profile(skills=["Python", "SQL"], experience_years=2, education_level="high-school", location="Tirana")
    )
    assert (result.skills_score, result.experience_score, result.education_score, result.location_score) == (
        50,
        40,
        60,
        70,
    )
    assert result.missing == ["Docker", "AWS"]
    assert result.overall == 51
    assert result.verdict == "fair"


def test_extra_experience_caps_at_100_and_remote_counts_as_local():
    result = compute_ats(job(location="Remote"), profile(experience_years=20, location=None))
    assert result.experience_score == 100
    assert result.location_score == 100


def test_missing_profile_and_empty_requirements():
    assert compute_ats(job(), None).verdict == "weak"
    lenient = compute_ats(job(required_skills=[], min_experience_years=0, education_level="any"), None)
    assert (lenient.skills_score, lenient.experience_score, lenient.education_score) == (100, 100, 100)
