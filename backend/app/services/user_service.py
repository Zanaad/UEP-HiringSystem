from sqlalchemy.orm import Session

from app.repositories.user_repository import UserRepository


class UserService:
    def __init__(self, db: Session) -> None:
        self.repository = UserRepository(db)

    def get_user(self, user_id: int):
        return self.repository.get_by_id(user_id)
