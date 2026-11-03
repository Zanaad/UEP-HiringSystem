from fastapi.testclient import TestClient

from app.main import app


def test_register_and_login_flow():
    client = TestClient(app)

    register_response = client.post(
        "/auth/register",
        json={
            "name": "Alice",
            "email": "alice@example.com",
            "password": "Secret123!",
            "role": "recruiter",
            "company_name": "Acme",
        },
    )
    assert register_response.status_code == 201
    assert register_response.json()["user"]["role"] == "recruiter"

    login_response = client.post(
        "/auth/login",
        json={"email": "alice@example.com", "password": "Secret123!"},
    )
    assert login_response.status_code == 200
    payload = login_response.json()
    assert payload["token_type"] == "bearer"
    assert payload["access_token"]
    assert payload["user"]["email"] == "alice@example.com"
    assert payload["user"]["role"] == "recruiter"


def test_login_rejects_bad_credentials():
    client = TestClient(app)
    client.post(
        "/auth/register",
        json={"name": "Alice", "email": "alice5@example.com", "password": "Secret123!", "role": "candidate"},
    )

    wrong_password = client.post("/auth/login", json={"email": "alice5@example.com", "password": "Wrong123!"})
    unknown_email = client.post("/auth/login", json={"email": "nobody@example.com", "password": "Secret123!"})

    assert wrong_password.status_code == 401
    assert unknown_email.status_code == 401


def test_register_rejects_weak_password():
    client = TestClient(app)

    response = client.post(
        "/auth/register",
        json={"name": "Alice", "email": "alice2@example.com", "password": "secret123", "role": "candidate"},
    )

    assert response.status_code == 422


def test_register_rejects_invalid_name():
    client = TestClient(app)

    response = client.post(
        "/auth/register",
        json={"name": "<script>", "email": "alice3@example.com", "password": "Secret123!", "role": "candidate"},
    )

    assert response.status_code == 422


def test_register_rejects_duplicate_email():
    client = TestClient(app)

    payload = {"name": "Alice", "email": "alice4@example.com", "password": "Secret123!", "role": "candidate"}
    first = client.post("/auth/register", json=payload)
    second = client.post("/auth/register", json=payload)

    assert first.status_code == 201
    assert second.status_code == 409


def test_candidate_cannot_read_other_user():
    client = TestClient(app)

    candidate_register = client.post(
        "/auth/register",
        json={
            "name": "Candidate User",
            "email": "candidate@example.com",
            "password": "Secret123!",
            "role": "candidate",
        },
    )
    recruiter_register = client.post(
        "/auth/register",
        json={
            "name": "Recruiter User",
            "email": "recruiter@example.com",
            "password": "Secret123!",
            "role": "recruiter",
            "company_name": "Acme",
        },
    )

    assert candidate_register.status_code == 201
    assert recruiter_register.status_code == 201

    candidate_token = candidate_register.json()["access_token"]
    recruiter_id = recruiter_register.json()["user"]["id"]

    response = client.get(
        f"/users/{recruiter_id}",
        headers={"Authorization": f"Bearer {candidate_token}"},
    )

    assert response.status_code == 403


def test_recruiter_can_read_other_user():
    client = TestClient(app)

    candidate_register = client.post(
        "/auth/register",
        json={
            "name": "Candidate User",
            "email": "candidate2@example.com",
            "password": "Secret123!",
            "role": "candidate",
        },
    )
    recruiter_register = client.post(
        "/auth/register",
        json={
            "name": "Recruiter User",
            "email": "recruiter2@example.com",
            "password": "Secret123!",
            "role": "recruiter",
            "company_name": "Acme",
        },
    )

    assert candidate_register.status_code == 201
    assert recruiter_register.status_code == 201

    recruiter_token = recruiter_register.json()["access_token"]
    candidate_id = candidate_register.json()["user"]["id"]

    response = client.get(
        f"/users/{candidate_id}",
        headers={"Authorization": f"Bearer {recruiter_token}"},
    )

    assert response.status_code == 200
    assert response.json()["id"] == candidate_id


def test_auth_me_requires_token():
    client = TestClient(app)

    response = client.get("/auth/me")

    assert response.status_code == 401


def test_recruiter_registration_requires_company():
    client = TestClient(app)

    response = client.post(
        "/auth/register",
        json={"name": "Rita", "email": "rita@example.com", "password": "Secret123!", "role": "recruiter"},
    )

    assert response.status_code == 422
