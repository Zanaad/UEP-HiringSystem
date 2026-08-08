from fastapi import APIRouter, Depends, HTTPException

from app.dependencies.auth import get_current_user
from app.database.connection import get_db
from app.models.user import User
from app.schemas.user_schema import UserRead
from app.services.user_service import UserService
from sqlalchemy.orm import Session

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserRead:
    if current_user.role != "recruiter" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    service = UserService(db)
    user = service.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserRead(id=user.id, name=user.name, email=user.email, role=user.role)
