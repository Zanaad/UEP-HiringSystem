from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import LoginRequest, TokenResponse, UserCreate, UserRead
from app.services.auth_utils import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    get_password_hash,
    verify_password,
)


class AuthService:
    def __init__(self, db: Session) -> None:
        self.repository = UserRepository(db)
        self.db = db

    def register(self, payload: UserCreate) -> TokenResponse:
        normalized_email = str(payload.email).strip().lower()
        existing_user = self.repository.get_by_email(normalized_email)
        if existing_user is not None:
            raise ValueError("Email already registered")

        user = User(
            name=payload.name,
            email=normalized_email,
            password_hash=get_password_hash(payload.password),
            role=payload.role,
        )
        try:
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
        except IntegrityError as exc:
            self.db.rollback()
            raise ValueError("Email already registered") from exc
        return self._build_token_response(user)

    def login(self, payload: LoginRequest) -> TokenResponse:
        normalized_email = str(payload.email).strip().lower()
        user = self.repository.get_by_email(normalized_email)
        password_hash = user.password_hash if user else DUMMY_PASSWORD_HASH
        if not verify_password(payload.password, password_hash) or user is None:
            raise ValueError("Invalid credentials")
        return self._build_token_response(user)

    def _build_token_response(self, user: User) -> TokenResponse:
        token = create_access_token(user.id, user.role)
        return TokenResponse(
            access_token=token,
            user=UserRead(id=user.id, name=user.name, email=user.email, role=user.role),
        )
