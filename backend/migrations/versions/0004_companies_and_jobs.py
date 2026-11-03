"""companies and jobs

Revision ID: 0004_companies_and_jobs
Revises: 0003_users_created_at
Create Date: 2026-11-03 00:00:00
"""

import sqlalchemy as sa
from alembic import op

revision = "0004_companies_and_jobs"
down_revision = "0003_users_created_at"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.add_column("users", sa.Column("company_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_users_company_id", "users", "companies", ["company_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_users_company_id", "users", ["company_id"])

    op.create_table(
        "jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("department", sa.String(length=80), nullable=False),
        sa.Column("location", sa.String(length=120), nullable=False),
        sa.Column("employment_type", sa.String(length=20), nullable=False),
        sa.Column("salary_range", sa.String(length=60), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("required_skills", sa.JSON(), nullable=False),
        sa.Column("min_experience_years", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("education_level", sa.String(length=20), nullable=False, server_default="any"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_jobs_status_created_at", "jobs", ["status", "created_at"])
    op.create_index("ix_jobs_company_id_created_at", "jobs", ["company_id", "created_at"])


def downgrade() -> None:
    op.drop_table("jobs")
    op.drop_constraint("fk_users_company_id", "users", type_="foreignkey")
    op.drop_index("ix_users_company_id", table_name="users")
    op.drop_column("users", "company_id")
    op.drop_table("companies")
