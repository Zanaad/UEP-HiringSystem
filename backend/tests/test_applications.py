from conftest import register

JOB = {
    "title": "Backend Engineer",
    "department": "Engineering",
    "location": "Prishtina",
    "employment_type": "full-time",
    "description": "Build and maintain the APIs behind our hiring platform.",
    "required_skills": ["Python", "FastAPI"],
    "min_experience_years": 2,
    "education_level": "bachelor",
    "status": "active",
}
PROFILE = {"skills": ["Python"], "experience_years": 2, "education_level": "bachelor", "location": "Prishtina"}


def create_job(client, recruiter, **overrides):
    response = client.post("/jobs", json={**JOB, **overrides}, headers=recruiter["headers"])
    assert response.status_code == 201
    return response.json()["id"]


def test_apply_scores_and_rejects_invalid_applications(client):
    recruiter = register(client, "rec@example.com", role="recruiter")
    candidate = register(client, "cand@example.com")
    job_id = create_job(client, recruiter)
    draft_id = create_job(client, recruiter, status="draft")
    client.put("/me/profile", json=PROFILE, headers=candidate["headers"])

    search = client.get("/jobs", headers=candidate["headers"]).json()["items"][0]
    assert search["match"]["missing"] == ["FastAPI"]
    assert search["applied"] is False

    applied = client.post("/applications", json={"job_id": job_id, "cover_note": "Hi"}, headers=candidate["headers"])
    assert applied.status_code == 201
    assert applied.json()["stage"] == "applied"
    assert applied.json()["ats"]["skills_score"] == 50

    assert client.post("/applications", json={"job_id": job_id}, headers=candidate["headers"]).status_code == 409
    assert client.post("/applications", json={"job_id": draft_id}, headers=candidate["headers"]).status_code == 404
    assert client.post("/applications", json={"job_id": job_id}, headers=recruiter["headers"]).status_code == 403

    search = client.get("/jobs", headers=candidate["headers"]).json()["items"][0]
    assert search["applied"] is True
    assert search["applicant_count"] == 1


def test_pipeline_is_scoped_to_company_and_tracks_history(client):
    recruiter = register(client, "rec@example.com", role="recruiter", company_name="Acme")
    rival = register(client, "rival@example.com", role="recruiter", company_name="Globex")
    candidate = register(client, "cand@example.com")
    job_id = create_job(client, recruiter)
    app_id = client.post("/applications", json={"job_id": job_id}, headers=candidate["headers"]).json()["id"]

    assert client.get("/applications", params={"job_id": job_id}, headers=rival["headers"]).status_code == 404
    assert client.get(f"/applications/{app_id}", headers=rival["headers"]).status_code == 404
    assert (
        client.patch(f"/applications/{app_id}/status", json={"stage": "hired"}, headers=rival["headers"]).status_code
        == 404
    )
    assert client.get(f"/applications/{app_id}", headers=candidate["headers"]).status_code == 403

    moved = client.patch(f"/applications/{app_id}/status", json={"stage": "interview"}, headers=recruiter["headers"])
    assert moved.status_code == 200
    assert [(e["from_stage"], e["to_stage"]) for e in moved.json()["events"]] == [
        (None, "applied"),
        ("applied", "interview"),
    ]

    note = client.post(
        f"/applications/{app_id}/notes", json={"body": "Strong API design"}, headers=recruiter["headers"]
    )
    assert note.status_code == 201
    assert client.post(f"/applications/{app_id}/notes", json={"body": "x"}, headers=rival["headers"]).status_code == 404

    mine = client.get("/applications/mine", headers=candidate["headers"]).json()
    assert mine[0]["stage"] == "interview"
    assert "notes" not in mine[0]


def test_ats_is_recomputed_when_profile_or_job_changes(client):
    recruiter = register(client, "rec@example.com", role="recruiter")
    candidate = register(client, "cand@example.com")
    job_id = create_job(client, recruiter)
    client.post("/applications", json={"job_id": job_id}, headers=candidate["headers"])

    client.put("/me/profile", json={**PROFILE, "skills": ["Python", "FastAPI"]}, headers=candidate["headers"])
    pipeline = client.get("/applications", params={"job_id": job_id}, headers=recruiter["headers"]).json()
    assert pipeline[0]["ats"]["skills_score"] == 100

    client.patch(f"/jobs/{job_id}", json={"required_skills": ["Go"]}, headers=recruiter["headers"])
    pipeline = client.get("/applications", params={"job_id": job_id}, headers=recruiter["headers"]).json()
    assert pipeline[0]["ats"]["missing"] == ["Go"]


def test_resume_upload_validation_and_access(client):
    recruiter = register(client, "rec@example.com", role="recruiter", company_name="Acme")
    rival = register(client, "rival@example.com", role="recruiter", company_name="Globex")
    candidate = register(client, "cand@example.com")

    fake_pdf = {"file": ("cv.pdf", b"<script>alert(1)</script>", "application/pdf")}
    assert client.put("/me/resume", files=fake_pdf, headers=candidate["headers"]).status_code == 415

    pdf = b"%PDF-1.7 test resume"
    uploaded = client.put(
        "/me/resume", files={"file": ("My CV.pdf", pdf, "application/pdf")}, headers=candidate["headers"]
    )
    assert uploaded.status_code == 200
    assert uploaded.json()["resume_filename"] == "My CV.pdf"

    app_id = client.post(
        "/applications", json={"job_id": create_job(client, recruiter)}, headers=candidate["headers"]
    ).json()["id"]
    download = client.get(f"/applications/{app_id}/resume", headers=recruiter["headers"])
    assert download.status_code == 200
    assert download.content == pdf
    assert client.get(f"/applications/{app_id}/resume", headers=rival["headers"]).status_code == 404
