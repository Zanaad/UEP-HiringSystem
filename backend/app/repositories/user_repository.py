from app.models.user import User


class UserRepository:
    def get_by_id(self, user_id: int) -> User | None:
        if user_id == 1:
            return User(id=1, name="Demo User", email="demo@hireprep.com")
        return None
