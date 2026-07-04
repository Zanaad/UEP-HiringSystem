from app.models.user import User
from app.repositories.user_repository import UserRepository


class UserService:
    def __init__(self, repository: UserRepository | None = None) -> None:
        self.repository = repository or UserRepository()

    def get_user(self, user_id: int) -> User | None:
        return self.repository.get_by_id(user_id)
