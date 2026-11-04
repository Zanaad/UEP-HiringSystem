import re
from typing import Annotated, Literal

from pydantic import (
    AfterValidator,
    BaseModel,
    EmailStr,
    Field,
    HttpUrl,
    StringConstraints,
    field_validator,
    model_validator,
)

from app.schemas.profile_schema import OptionalText

RoleType = Literal["candidate", "recruiter"]

NAME_PATTERN = re.compile(r"^[A-Za-z][A-Za-z\s'-]{1,79}$")
PASSWORD_SPECIAL_PATTERN = re.compile(r"[^A-Za-z0-9]")


def check_name(value: str) -> str:
    name = value.strip()
    if not NAME_PATTERN.fullmatch(name):
        raise ValueError("Name must be 2-80 characters and contain only letters, spaces, apostrophes, or hyphens")
    return name


def check_password_strength(value: str) -> str:
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


Name = Annotated[str, AfterValidator(check_name)]
StrongPassword = Annotated[str, AfterValidator(check_password_strength)]


class UserCreate(BaseModel):
    name: Name
    email: EmailStr
    password: StrongPassword
    role: RoleType
    company_name: str | None = Field(default=None, max_length=120)

    @model_validator(mode="after")
    def validate_company(self) -> "UserCreate":
        if self.role == "candidate":
            self.company_name = None
        elif not self.company_name or len(self.company_name.strip()) < 2:
            raise ValueError("Company name is required for recruiters")
        else:
            self.company_name = self.company_name.strip()
        return self


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


class AccountUpdate(BaseModel):
    name: Name


class PasswordChange(BaseModel):
    current_password: str = Field(max_length=128)
    new_password: StrongPassword


class CompanyUpdate(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=120)]
    website: HttpUrl | None = None
    industry: OptionalText = None
    size: Literal["1-10", "11-50", "51-200", "201-500", "500+"] | None = None
    location: OptionalText = None


class CompanyRead(BaseModel):
    name: str
    website: str | None = None
    industry: str | None = None
    size: str | None = None
    location: str | None = None
