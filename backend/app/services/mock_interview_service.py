from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.config.settings import settings
from app.exceptions import ConflictError, NotFoundError, RateLimitError
from app.models.job import Job
from app.models.mock_interview import MockInterviewQuestion, MockInterviewSession
from app.models.user import User
from app.repositories.mock_interview_repository import MockInterviewRepository
from app.schemas.mock_interview_schema import (
    AnswerSubmit,
    MockInterviewStart,
    QuestionRead,
    SessionRead,
    SessionSummary,
)
from app.services.llm_service import GeneratedQuestion, LLMError, get_provider

BEHAVIORAL = [
    (
        "Behavioral",
        "Tell me about yourself and your professional background.",
        "Structure it as past, present, future. Keep it under two minutes and tie your story to the role.",
    ),
    (
        "Behavioral",
        "Describe a time you faced a significant challenge at work or university and how you overcame it.",
        "Use the STAR method: Situation, Task, Action, Result. Quantify the outcome if you can.",
    ),
    (
        "Behavioral",
        "Tell me about a time you disagreed with your manager or team. How did you handle it?",
        "Show that you can argue for your view while staying respectful and focused on the goal.",
    ),
    (
        "Behavioral",
        "Give an example of a goal you set and how you achieved it.",
        "Pick a goal that shows ambition and follow-through. Concrete numbers make a strong impression.",
    ),
    (
        "Behavioral",
        "Tell me about a mistake you made and what you learned from it.",
        "Own the mistake, explain how you fixed it and what you now do differently.",
    ),
]

TRACKS = {
    "behavioral": (
        "Behavioral Interview",
        "Situational questions about communication, teamwork and ownership.",
        BEHAVIORAL,
    ),
    "frontend": (
        "Technical Frontend Interview",
        "JavaScript, React, CSS and web performance.",
        [
            (
                "React",
                "Explain the difference between useMemo and useCallback. When would you use each?",
                "Explain what each hook memoises (a value or a function) and give a concrete use case for each.",
            ),
            (
                "JavaScript",
                "How does the JavaScript event loop work? Describe the call stack, task queue and microtask queue.",
                "Walk through an example: promises run in the microtask queue, setTimeout in the task queue.",
            ),
            (
                "Performance",
                "How would you optimise a React app that renders a list of 10,000 items?",
                "Think about virtualisation, pagination, memoisation and lazy loading.",
            ),
            (
                "CSS",
                "Explain the CSS box model and the difference between content-box and border-box.",
                "Describe content, padding, border and margin, then how width is calculated in each mode.",
            ),
            (
                "Architecture",
                "How would you structure a large React codebase so it stays maintainable as it grows?",
                "Cover folder structure, code splitting, shared components and state management.",
            ),
        ],
    ),
    "product": (
        "Product Management Interview",
        "Product sense, prioritisation and metrics.",
        [
            (
                "Product Sense",
                "How would you improve a music streaming app's discovery feature for new users?",
                "Clarify assumptions, pick a user segment, define success metrics, then prioritise by impact.",
            ),
            (
                "Prioritisation",
                "You have 10 features requested by customers. How do you decide what to build next?",
                "Mention a framework such as RICE or MoSCoW and tie decisions to business goals.",
            ),
            (
                "Metrics",
                "Daily active users dropped 15% last week. Walk me through how you would investigate.",
                "Segment the data, check external factors, compare with history, then form hypotheses.",
            ),
            (
                "Strategy",
                "Should a startup enter the enterprise market or double down on consumers?",
                "Compare market size, competition, current capabilities and strategic fit.",
            ),
        ],
    ),
    "system-design": (
        "System Design Interview",
        "Design scalable systems and talk through trade-offs.",
        [
            (
                "System Design",
                "Design a URL shortener. Walk through the architecture end to end.",
                "Clarify scale first, then cover the API, database schema, ID generation, caching and CDN.",
            ),
            (
                "System Design",
                "How would you design a real-time chat system for millions of users?",
                "Cover WebSocket connections, delivery guarantees, offline storage and group fan-out.",
            ),
            (
                "System Design",
                "Design a rate limiter that can be shared across several services.",
                "Compare token bucket and leaky bucket, shared state such as Redis, and failure modes.",
            ),
        ],
    ),
}


def _start_of_day() -> datetime:
    return datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=None)


def _job_context(job: Job) -> str:
    skills = ", ".join(job.required_skills) or "not specified"
    return (
        f"{job.title} at {job.company.name}\nDepartment: {job.department}\nRequired skills: {skills}\n"
        f"Minimum experience: {job.min_experience_years} years\nJob description:\n{job.description[:3000]}"
    )


def _fallback_questions(track: str | None, job: Job | None, count: int) -> list[GeneratedQuestion]:
    bank = list(TRACKS[track][2]) if track else list(BEHAVIORAL)
    if job is not None:
        skills = ", ".join(job.required_skills[:5]) or "the skills in the job description"
        bank.insert(
            1,
            (
                "Role",
                f"Why are you interested in the {job.title} role, and how does your experience with "
                f"{skills} prepare you for it?",
                "Connect two or three concrete experiences to the role.",
            ),
        )
    return [GeneratedQuestion(category=c, question=q, tip=t) for c, q, t in bank[:count]]


class MockInterviewService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repository = MockInterviewRepository(db)

    def start(self, candidate: User, payload: MockInterviewStart) -> SessionRead:
        if self.repository.sessions_since(candidate.id, _start_of_day()) >= settings.mock_interview_daily_sessions:
            raise RateLimitError("You have reached today's limit of mock interviews. Try again tomorrow.")

        job = None
        if payload.job_id is not None:
            job = self.repository.job_for_candidate(payload.job_id, candidate.id)
            if job is None:
                raise NotFoundError("Job not found")
            title, context = f"{job.title} at {job.company.name}", _job_context(job)
        else:
            title, description, _ = TRACKS[payload.track]
            context = f"{title}\n{description}"

        provider = get_provider()
        provider_name, model = "fallback", "question-bank"
        questions = None
        if provider is not None:
            try:
                questions = provider.generate_questions(context, payload.num_questions)
                provider_name, model = provider.name, provider.model
            except LLMError:
                questions = None
        questions = questions or _fallback_questions(payload.track, job, payload.num_questions)

        session = MockInterviewSession(
            candidate_id=candidate.id,
            job_id=job.id if job else None,
            track=payload.track,
            title=title[:200],
            status="in_progress",
            llm_provider=provider_name,
            llm_model=model[:80],
            questions=[
                MockInterviewQuestion(position=i, category=q.category, question=q.question, tip=q.tip)
                for i, q in enumerate(questions)
            ],
        )
        self.db.add(session)
        self.db.commit()
        return self.get(candidate, session.id)

    def list(self, candidate: User) -> list[SessionSummary]:
        return [
            SessionSummary(
                id=session.id,
                title=session.title,
                track=session.track,
                job_id=session.job_id,
                status=session.status,
                overall_score=session.overall_score,
                ai_generated=session.llm_provider != "fallback",
                question_count=question_count,
                answered_count=answered_count,
                created_at=session.created_at,
            )
            for session, question_count, answered_count in self.repository.list_for_candidate(candidate.id)
        ]

    def get(self, candidate: User, session_id: int) -> SessionRead:
        return self._read(self._owned(candidate, session_id))

    def answer(self, candidate: User, session_id: int, payload: AnswerSubmit) -> QuestionRead:
        session = self._owned(candidate, session_id)
        if session.status == "completed":
            raise ConflictError("This mock interview is already completed")
        question = next((q for q in session.questions if q.id == payload.question_id), None)
        if question is None:
            raise NotFoundError("Question not found")
        if self.repository.answers_since(candidate.id, _start_of_day()) >= settings.mock_interview_daily_answers:
            raise RateLimitError("You have reached today's limit of evaluated answers. Try again tomorrow.")

        question.answer = payload.answer
        question.answered_at = datetime.now(UTC).replace(tzinfo=None)
        question.score = question.strengths = question.improvements = question.suggestion = None

        provider = get_provider()
        if provider is not None:
            context = session.title if session.job_id is None else self._job_context(session)
            try:
                feedback = provider.evaluate_answer(context, question.question, payload.answer)
                question.score = feedback.score
                question.strengths = feedback.strengths
                question.improvements = feedback.improvements
                question.suggestion = feedback.suggestion
            except LLMError:
                pass
        self.db.commit()
        return QuestionRead.model_validate(question)

    def complete(self, candidate: User, session_id: int) -> SessionRead:
        session = self._owned(candidate, session_id)
        if session.status != "completed":
            scores = [q.score for q in session.questions if q.score is not None]
            session.overall_score = round(sum(scores) / len(scores)) if scores else None
            session.status = "completed"
            session.completed_at = datetime.now(UTC).replace(tzinfo=None)
            self.db.commit()
            session = self._owned(candidate, session_id)
        return self._read(session)

    def _job_context(self, session: MockInterviewSession) -> str:
        job = self.repository.job_for_candidate(session.job_id, session.candidate_id)
        return _job_context(job) if job else session.title

    def _owned(self, candidate: User, session_id: int) -> MockInterviewSession:
        session = self.repository.get_owned(session_id, candidate.id)
        if session is None:
            raise NotFoundError("Mock interview not found")
        return session

    @staticmethod
    def _read(session: MockInterviewSession) -> SessionRead:
        return SessionRead(
            id=session.id,
            title=session.title,
            track=session.track,
            job_id=session.job_id,
            status=session.status,
            overall_score=session.overall_score,
            ai_generated=session.llm_provider != "fallback",
            ai_feedback_enabled=get_provider() is not None,
            created_at=session.created_at,
            completed_at=session.completed_at,
            questions=[QuestionRead.model_validate(q) for q in session.questions],
        )
