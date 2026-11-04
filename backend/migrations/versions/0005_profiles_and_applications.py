"""candidate profiles and applications

Revision ID: 0005_profiles_and_applications
Revises: 0004_companies_and_jobs
Create Date: 2026-11-04 00:00:00
"""

import sqlalchemy as sa
from alembic import op

revision = "0005_profiles_and_applications"
down_revision = "0004_companies_and_jobs"
branch_labels = None
depends_on = None

NOW = sa.text("CURRENT_TIMESTAMP")


def upgrade() -> None:
    op.create_table(
        "candidate_profiles",
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("headline", sa.String(length=120)),
        sa.Column("phone", sa.String(length=30)),
        sa.Column("location", sa.String(length=120)),
        sa.Column("linkedin_url", sa.String(length=255)),
        sa.Column("github_url", sa.String(length=255)),
        sa.Column("portfolio_url", sa.String(length=255)),
        sa.Column("skills", sa.JSON(), nullable=False),
        sa.Column("experience_years", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("education_level", sa.String(length=20)),
        sa.Column("resume_path", sa.String(length=64)),
        sa.Column("resume_filename", sa.String(length=255)),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=NOW),
    )

    op.create_table(
        "applications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("job_id", sa.Integer(), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("candidate_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("stage", sa.String(length=20), nullable=False, server_default="applied"),
        sa.Column("ats_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ats", sa.JSON(), nullable=False),
        sa.Column("cover_note", sa.Text()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=NOW),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=NOW),
        sa.UniqueConstraint("job_id", "candidate_id", name="uq_applications_job_candidate"),
    )
    op.create_index("ix_applications_candidate_id_created_at", "applications", ["candidate_id", "created_at"])

    op.create_table(
        "application_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("from_stage", sa.String(length=20)),
        sa.Column("to_stage", sa.String(length=20), nullable=False),
        sa.Column("changed_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=NOW),
    )
    op.create_index("ix_application_events_application_id", "application_events", ["application_id"])

    op.create_table(
        "application_notes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("applications.id", ondelete="CASCADE"), nullable=False),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=NOW),
    )
    op.create_index("ix_application_notes_application_id", "application_notes", ["application_id"])


def downgrade() -> None:
    op.drop_table("application_notes")
    op.drop_table("application_events")
    op.drop_table("applications")
    op.drop_table("candidate_profiles")
