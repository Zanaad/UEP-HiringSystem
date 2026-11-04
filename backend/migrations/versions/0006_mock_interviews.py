"""mock interviews

Revision ID: 0006_mock_interviews
Revises: 0005_profiles_and_applications
Create Date: 2026-11-04 00:00:00
"""

import sqlalchemy as sa
from alembic import op

revision = "0006_mock_interviews"
down_revision = "0005_profiles_and_applications"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "mock_interview_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("candidate_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", sa.Integer(), sa.ForeignKey("jobs.id", ondelete="SET NULL")),
        sa.Column("track", sa.String(length=40)),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="in_progress"),
        sa.Column("overall_score", sa.Integer()),
        sa.Column("llm_provider", sa.String(length=20), nullable=False),
        sa.Column("llm_model", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("completed_at", sa.DateTime()),
    )
    op.create_index(
        "ix_mock_sessions_candidate_id_created_at", "mock_interview_sessions", ["candidate_id", "created_at"]
    )

    op.create_table(
        "mock_interview_questions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "session_id",
            sa.Integer(),
            sa.ForeignKey("mock_interview_sessions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("tip", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text()),
        sa.Column("score", sa.Integer()),
        sa.Column("strengths", sa.JSON()),
        sa.Column("improvements", sa.JSON()),
        sa.Column("suggestion", sa.Text()),
        sa.Column("answered_at", sa.DateTime()),
    )
    op.create_index("ix_mock_interview_questions_session_id", "mock_interview_questions", ["session_id"])


def downgrade() -> None:
    op.drop_table("mock_interview_questions")
    op.drop_table("mock_interview_sessions")
