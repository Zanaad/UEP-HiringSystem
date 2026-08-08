from fastapi import APIRouter, Depends, HTTPException

from app.database.connection import get_db
from app.schemas.user_schema import UserRead
from app.services.user_service import UserService
from sqlalchemy.orm import Session

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: Session = Depends(get_db)) -> UserRead:
    service = UserService(db)
    user = service.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserRead(id=user.id, name=user.name, email=user.email, role=user.role)
