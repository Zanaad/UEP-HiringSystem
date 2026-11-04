from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User
from app.schemas.user_schema import AccountUpdate, CompanyRead, CompanyUpdate, PasswordChange, UserRead
from app.services.user_service import UserService

router = APIRouter(prefix="/me", tags=["account"])
recruiter_only = require_roles("recruiter")


@router.patch("/account", response_model=UserRead)
def update_account(payload: AccountUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return UserService(db).update_account(user, payload)


@router.post("/password", status_code=204)
def change_password(payload: PasswordChange, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        UserService(db).change_password(user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return Response(status_code=204)


@router.get("/company", response_model=CompanyRead)
def get_company(db: Session = Depends(get_db), user: User = Depends(recruiter_only)):
    return UserService(db).get_company(user)


@router.put("/company", response_model=CompanyRead)
def update_company(payload: CompanyUpdate, db: Session = Depends(get_db), user: User = Depends(recruiter_only)):
    return UserService(db).update_company(user, payload)
