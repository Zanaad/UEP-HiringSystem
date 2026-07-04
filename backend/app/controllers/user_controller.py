from fastapi import APIRouter, HTTPException

from app.schemas.user_schema import UserRead
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])
service = UserService()


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int) -> UserRead:
    user = service.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserRead(id=user.id, name=user.name, email=user.email)
