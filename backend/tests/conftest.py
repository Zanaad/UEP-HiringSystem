import os
import sys
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-that-is-at-least-32-chars")
os.environ.setdefault("UPLOAD_DIR", tempfile.mkdtemp(prefix="hireprep-test-uploads-"))

from app.database.base import Base  # noqa: E402
from app.database.connection import engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import application, candidate_profile, company, job, user  # noqa: E402, F401


@pytest.fixture(autouse=True)
def clean_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def register(client: TestClient, email: str, role: str = "candidate", company_name: str | None = "Acme") -> dict:
    payload = {"name": "Test User", "email": email, "password": "Secret123!", "role": role}
    if role == "recruiter":
        payload["company_name"] = company_name
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201, response.text
    body = response.json()
    return {"id": body["user"]["id"], "headers": {"Authorization": f"Bearer {body['access_token']}"}}
