from datetime import datetime, timedelta, timezone
import hashlib

from jose import jwt

from app.config.settings import settings


def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password


def create_access_token(subject: str | int, role: str) -> str:
    expire_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(subject), "role": role, "exp": expire_at}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
