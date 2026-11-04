from sqlalchemy.orm import Session

from app.exceptions import ConflictError
from app.models.company import Company
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import AccountUpdate, CompanyRead, CompanyUpdate, PasswordChange, UserRead
from app.services.auth_utils import get_password_hash, verify_password


class UserService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = UserRepository(db)

    def get_user(self, user_id: int):
        return self.repository.get_by_id(user_id)

    def update_account(self, user: User, payload: AccountUpdate) -> UserRead:
        user.name = payload.name
        self.db.commit()
        return UserRead(id=user.id, name=user.name, email=user.email, role=user.role)

    def change_password(self, user: User, payload: PasswordChange) -> None:
        if not verify_password(payload.current_password, user.password_hash):
            raise ValueError("Current password is incorrect")
        user.password_hash = get_password_hash(payload.new_password)
        self.db.commit()

    def get_company(self, recruiter: User) -> CompanyRead:
        return CompanyRead.model_validate(self._company(recruiter), from_attributes=True)

    def update_company(self, recruiter: User, payload: CompanyUpdate) -> CompanyRead:
        company = self._company(recruiter)
        for field, value in payload.model_dump(mode="json").items():
            setattr(company, field, value)
        self.db.commit()
        return CompanyRead.model_validate(company, from_attributes=True)

    def _company(self, recruiter: User) -> Company:
        company = self.db.get(Company, recruiter.company_id) if recruiter.company_id else None
        if company is None:
            raise ConflictError("Your account is not linked to a company")
        return company
