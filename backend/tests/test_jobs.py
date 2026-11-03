from conftest import register

JOB = {
    "title": "Backend Engineer",
    "department": "Engineering",
    "location": "Prishtina",
    "employment_type": "full-time",
    "description": "Build and maintain the APIs behind our hiring platform.",
    "required_skills": ["Python", "FastAPI", " python ", ""],
    "min_experience_years": 2,
    "education_level": "bachelor",
}


def test_job_lifecycle_and_visibility(client):
    recruiter = register(client, "rec@example.com", role="recruiter")
    candidate = register(client, "cand@example.com")

    created = client.post("/jobs", json=JOB, headers=recruiter["headers"])
    assert created.status_code == 201
    job = created.json()
    assert job["status"] == "draft"
    assert job["company_name"] == "Acme"
    assert job["required_skills"] == ["Python", "FastAPI"]

    assert client.get("/jobs").json()["total"] == 0

    published = client.patch(f"/jobs/{job['id']}", json={"status": "active"}, headers=recruiter["headers"])
    assert published.status_code == 200
    assert client.get("/jobs").json()["total"] == 1

    client.patch(f"/jobs/{job['id']}", json={"status": "closed"}, headers=recruiter["headers"])
    assert client.get("/jobs").json()["total"] == 0
    assert len(client.get("/recruiter/jobs", headers=recruiter["headers"]).json()) == 1

    assert client.post("/jobs", json=JOB, headers=candidate["headers"]).status_code == 403
    assert client.get("/recruiter/jobs", headers=candidate["headers"]).status_code == 403


def test_recruiter_cannot_touch_other_company_jobs(client):
    owner = register(client, "owner@example.com", role="recruiter", company_name="Acme")
    other = register(client, "other@example.com", role="recruiter", company_name="Globex")
    job_id = client.post("/jobs", json=JOB, headers=owner["headers"]).json()["id"]

    response = client.patch(f"/jobs/{job_id}", json={"title": "Hijacked"}, headers=other["headers"])

    assert response.status_code == 404
    assert client.get("/recruiter/jobs", headers=other["headers"]).json() == []


def test_update_rejects_null_for_required_fields(client):
    recruiter = register(client, "rec@example.com", role="recruiter")
    job_id = client.post("/jobs", json=JOB, headers=recruiter["headers"]).json()["id"]

    response = client.patch(f"/jobs/{job_id}", json={"title": None}, headers=recruiter["headers"])

    assert response.status_code == 422


def test_public_search_filters_and_paginates(client):
    recruiter = register(client, "rec@example.com", role="recruiter", company_name="Acme")
    for title, employment_type in [
        ("Backend Engineer", "full-time"),
        ("Data Intern", "internship"),
        ("QA_Lead", "contract"),
    ]:
        client.post(
            "/jobs",
            json={**JOB, "title": title, "employment_type": employment_type, "status": "active"},
            headers=recruiter["headers"],
        )

    assert client.get("/jobs", params={"q": "backend"}).json()["total"] == 1
    assert client.get("/jobs", params={"q": "acme"}).json()["total"] == 3
    assert client.get("/jobs", params={"q": "_"}).json()["total"] == 1
    assert client.get("/jobs", params={"employment_type": "internship"}).json()["total"] == 1

    page = client.get("/jobs", params={"page": 2, "page_size": 2}).json()
    assert page["total"] == 3
    assert len(page["items"]) == 1
