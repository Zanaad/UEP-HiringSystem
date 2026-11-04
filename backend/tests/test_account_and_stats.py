from conftest import register

JOB = {
    "title": "Backend Engineer",
    "department": "Engineering",
    "location": "Prishtina",
    "employment_type": "full-time",
    "description": "Build and maintain the APIs behind our hiring platform.",
    "status": "active",
}


def test_change_password(client):
    user = register(client, "cand@example.com")
    url = "/me/password"

    wrong = client.post(
        url, json={"current_password": "Wrong123!", "new_password": "Newpass123!"}, headers=user["headers"]
    )
    weak = client.post(url, json={"current_password": "Secret123!", "new_password": "weak"}, headers=user["headers"])
    ok = client.post(
        url, json={"current_password": "Secret123!", "new_password": "Newpass123!"}, headers=user["headers"]
    )

    assert (wrong.status_code, weak.status_code, ok.status_code) == (400, 422, 204)
    assert client.post("/auth/login", json={"email": "cand@example.com", "password": "Secret123!"}).status_code == 401
    assert client.post("/auth/login", json={"email": "cand@example.com", "password": "Newpass123!"}).status_code == 200


def test_company_settings_are_recruiter_only(client):
    recruiter = register(client, "rec@example.com", role="recruiter", company_name="Acme")
    candidate = register(client, "cand@example.com")
    body = {"name": "Acme Kosovo", "website": "https://acme.example", "size": "11-50", "industry": " "}

    updated = client.put("/me/company", json=body, headers=recruiter["headers"])

    assert updated.status_code == 200
    assert updated.json()["industry"] is None
    assert (
        client.put(
            "/me/company", json={**body, "website": "javascript:alert(1)"}, headers=recruiter["headers"]
        ).status_code
        == 422
    )
    assert client.get("/me/company", headers=candidate["headers"]).status_code == 403
    assert client.get("/jobs").json()["total"] == 0


def test_recruiter_stats_are_scoped_and_count_the_funnel(client):
    recruiter = register(client, "rec@example.com", role="recruiter", company_name="Acme")
    rival = register(client, "rival@example.com", role="recruiter", company_name="Globex")
    job_id = client.post("/jobs", json=JOB, headers=recruiter["headers"]).json()["id"]

    app_ids = []
    for email in ["a@example.com", "b@example.com", "c@example.com"]:
        candidate = register(client, email)
        app_ids.append(client.post("/applications", json={"job_id": job_id}, headers=candidate["headers"]).json()["id"])

    def move(app_id, stage):
        client.patch(f"/applications/{app_id}/status", json={"stage": stage}, headers=recruiter["headers"])

    move(app_ids[0], "interview")
    move(app_ids[0], "hired")
    move(app_ids[1], "screening")
    move(app_ids[2], "screening")
    move(app_ids[2], "rejected")

    stats = client.get("/recruiter/stats", headers=recruiter["headers"]).json()
    assert (stats["active_jobs"], stats["total_candidates"], stats["hires_this_month"]) == (1, 3, 1)
    assert [step["count"] for step in stats["funnel"]] == [3, 3, 1, 1, 1, 1]
    assert stats["trend"][-1] == {**stats["trend"][-1], "applications": 3, "hires": 1}
    assert [match["application_id"] for match in stats["top_matches"]] == [app_ids[1]]
    assert stats["recent_activity"][0]["to_stage"] == "rejected"

    rival_stats = client.get("/recruiter/stats", headers=rival["headers"]).json()
    assert (rival_stats["total_candidates"], rival_stats["recent_activity"]) == (0, [])
