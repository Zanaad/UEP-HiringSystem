from datetime import UTC, datetime

from sqlalchemy import case, distinct, extract, func, select
from sqlalchemy.orm import Session, aliased

from app.exceptions import ConflictError
from app.models.application import Application, ApplicationEvent
from app.models.job import Job
from app.models.user import User
from app.schemas.stats_schema import ActivityItem, FunnelStep, MonthPoint, RecruiterStats, TopMatch

FUNNEL_STAGES = ["applied", "screening", "interview", "technical", "offer", "hired"]
TREND_MONTHS = 6


def _months_back(now: datetime, count: int) -> list[tuple[int, int]]:
    months = []
    year, month = now.year, now.month
    for _ in range(count):
        months.append((year, month))
        year, month = (year - 1, 12) if month == 1 else (year, month - 1)
    return months[::-1]


class StatsService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def recruiter(self, recruiter: User) -> RecruiterStats:
        if recruiter.company_id is None:
            raise ConflictError("Your account is not linked to a company")
        company = Job.company_id == recruiter.company_id
        now = datetime.now(UTC).replace(tzinfo=None)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        months = _months_back(now, TREND_MONTHS)
        trend_start = datetime(months[0][0], months[0][1], 1)

        active_jobs = self.db.scalar(select(func.count(Job.id)).where(company, Job.status == "active")) or 0
        by_stage = dict(
            self.db.execute(
                select(Application.stage, func.count(Application.id))
                .join(Application.job)
                .where(company)
                .group_by(Application.stage)
            ).all()
        )

        hires_this_month = (
            self.db.scalar(
                select(func.count(distinct(ApplicationEvent.application_id)))
                .join(Application, Application.id == ApplicationEvent.application_id)
                .join(Application.job)
                .where(company, ApplicationEvent.to_stage == "hired", ApplicationEvent.created_at >= month_start)
            )
            or 0
        )

        # Funnel counts each candidate at every stage up to the furthest one they reached.
        rank = case({stage: i for i, stage in enumerate(FUNNEL_STAGES)}, value=ApplicationEvent.to_stage, else_=-1)
        reached = (
            select(func.max(rank).label("reached"))
            .join(Application, Application.id == ApplicationEvent.application_id)
            .join(Application.job)
            .where(company)
            .group_by(ApplicationEvent.application_id)
            .subquery()
        )
        reached_counts = dict(
            self.db.execute(select(reached.c.reached, func.count()).group_by(reached.c.reached)).all()
        )
        funnel = [
            FunnelStep(stage=stage, count=sum(n for level, n in reached_counts.items() if level >= i))
            for i, stage in enumerate(FUNNEL_STAGES)
        ]

        year, month = extract("year", Application.created_at), extract("month", Application.created_at)
        applications_by_month = {
            (int(y), int(m)): n
            for y, m, n in self.db.execute(
                select(year, month, func.count(Application.id))
                .join(Application.job)
                .where(company, Application.created_at >= trend_start)
                .group_by(year, month)
            ).all()
        }
        hire_year, hire_month = (
            extract("year", ApplicationEvent.created_at),
            extract("month", ApplicationEvent.created_at),
        )
        hires_by_month = {
            (int(y), int(m)): n
            for y, m, n in self.db.execute(
                select(hire_year, hire_month, func.count(distinct(ApplicationEvent.application_id)))
                .join(Application, Application.id == ApplicationEvent.application_id)
                .join(Application.job)
                .where(company, ApplicationEvent.to_stage == "hired", ApplicationEvent.created_at >= trend_start)
                .group_by(hire_year, hire_month)
            ).all()
        }
        trend = [
            MonthPoint(
                month=datetime(y, m, 1).strftime("%b"),
                applications=applications_by_month.get((y, m), 0),
                hires=hires_by_month.get((y, m), 0),
            )
            for y, m in months
        ]

        candidate, actor = aliased(User), aliased(User)
        recent_activity = [
            ActivityItem(
                application_id=event.application_id,
                candidate_name=candidate_name,
                job_title=job_title,
                from_stage=event.from_stage,
                to_stage=event.to_stage,
                actor_name=actor_name,
                created_at=event.created_at,
            )
            for event, candidate_name, job_title, actor_name in self.db.execute(
                select(ApplicationEvent, candidate.name, Job.title, actor.name)
                .join(Application, Application.id == ApplicationEvent.application_id)
                .join(Application.job)
                .join(candidate, candidate.id == Application.candidate_id)
                .outerjoin(actor, actor.id == ApplicationEvent.changed_by)
                .where(company)
                .order_by(ApplicationEvent.created_at.desc(), ApplicationEvent.id.desc())
                .limit(8)
            ).all()
        ]

        top_matches = [
            TopMatch(application_id=app_id, candidate_name=name, job_title=title, stage=stage, ats_score=score)
            for app_id, name, title, stage, score in self.db.execute(
                select(Application.id, User.name, Job.title, Application.stage, Application.ats_score)
                .join(Application.job)
                .join(User, User.id == Application.candidate_id)
                .where(company, Job.status == "active", Application.stage.in_(["applied", "screening"]))
                .order_by(Application.ats_score.desc(), Application.created_at)
                .limit(5)
            ).all()
        ]

        return RecruiterStats(
            active_jobs=active_jobs,
            total_candidates=sum(by_stage.values()),
            interviewing=by_stage.get("interview", 0) + by_stage.get("technical", 0),
            hires_this_month=hires_this_month,
            funnel=funnel,
            trend=trend,
            recent_activity=recent_activity,
            top_matches=top_matches,
        )
