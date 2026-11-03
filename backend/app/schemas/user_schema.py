import re
from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator

RoleType = Literal["candidate", "recruiter"]

NAME_PATTERN = re.compile(r"^[A-Za-z][A-Za-z\s'-]{1,79}$")
PASSWORD_SPECIAL_PATTERN = re.compile(r"[^A-Za-z0-9]")


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: RoleType

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        name = value.strip()
        if not NAME_PATTERN.fullmatch(name):
            raise ValueError("Name must be 2-80 characters and contain only letters, spaces, apostrophes, or hyphens")
        return name

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8 or len(value) > 128:
            raise ValueError("Password must be at least 8 characters")
        if not any(ch.islower() for ch in value):
            raise ValueError("Password must include at least one lowercase letter")
        if not any(ch.isupper() for ch in value):
            raise ValueError("Password must include at least one uppercase letter")
        if not any(ch.isdigit() for ch in value):
            raise ValueError("Password must include at least one number")
        if not PASSWORD_SPECIAL_PATTERN.search(value):
            raise ValueError("Password must include at least one special character")
        return value


class UserRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: RoleType


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8 or len(value) > 128:
            raise ValueError("Password must be at least 8 characters")
        return value


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
