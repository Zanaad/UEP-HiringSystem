import base64
import hashlib
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.config.settings import settings


def _prehash(password: str) -> bytes:
    # bcrypt only reads 72 bytes; pre-hashing lets the full 128-char password count.
    return base64.b64encode(hashlib.sha256(password.encode("utf-8")).digest())


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(_prehash(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(_prehash(plain_password), hashed_password.encode("utf-8"))
    except ValueError:
        return False


# Checked when the email is unknown so login takes the same time either way.
DUMMY_PASSWORD_HASH = get_password_hash("dummy-password")


def create_access_token(subject: str | int, role: str) -> str:
    expire_at = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(subject), "role": role, "exp": expire_at}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
