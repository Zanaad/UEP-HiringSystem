"""add created_at to users

Revision ID: 0003_users_created_at
Revises: 0002_user_auth
Create Date: 2026-11-03 00:00:00
"""

import sqlalchemy as sa
from alembic import op

revision = "0003_users_created_at"
down_revision = "0002_user_auth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )


def downgrade() -> None:
    op.drop_column("users", "created_at")
