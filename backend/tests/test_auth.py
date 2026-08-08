import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_auth.db")

from app.main import app
from app.database.base import Base
from app.database.connection import engine


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_register_and_login_flow():
    client = TestClient(app)

    register_response = client.post(
        "/auth/register",
        json={"name": "Alice", "email": "alice@example.com", "password": "Secret123!", "role": "recruiter"},
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
