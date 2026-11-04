from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.dependencies.auth import require_roles
from app.models.user import User
from app.schemas.mock_interview_schema import (
    AnswerSubmit,
    MockInterviewStart,
    QuestionRead,
    SessionRead,
    SessionSummary,
)
from app.services.mock_interview_service import MockInterviewService

router = APIRouter(prefix="/mock-interviews", tags=["mock interviews"])
candidate_only = require_roles("candidate")


@router.post("", response_model=SessionRead, status_code=201)
def start(payload: MockInterviewStart, db: Session = Depends(get_db), user: User = Depends(candidate_only)):
    return MockInterviewService(db).start(user, payload)


@router.get("", response_model=list[SessionSummary])
def list_sessions(db: Session = Depends(get_db), user: User = Depends(candidate_only)):
    return MockInterviewService(db).list(user)


@router.get("/{session_id}", response_model=SessionRead)
def get_session(session_id: int, db: Session = Depends(get_db), user: User = Depends(candidate_only)):
    return MockInterviewService(db).get(user, session_id)


@router.post("/{session_id}/answers", response_model=QuestionRead)
def answer(session_id: int, payload: AnswerSubmit, db: Session = Depends(get_db), user: User = Depends(candidate_only)):
    return MockInterviewService(db).answer(user, session_id, payload)


@router.post("/{session_id}/complete", response_model=SessionRead)
def complete(session_id: int, db: Session = Depends(get_db), user: User = Depends(candidate_only)):
    return MockInterviewService(db).complete(user, session_id)
