from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_roles
from app.models.user import User
from app.schemas.stats_schema import RecruiterStats
from app.services.stats_service import StatsService

router = APIRouter(tags=["stats"])


@router.get("/recruiter/stats", response_model=RecruiterStats)
def recruiter_stats(db: Session = Depends(get_db), user: User = Depends(require_roles("recruiter"))):
    return StatsService(db).recruiter(user)
