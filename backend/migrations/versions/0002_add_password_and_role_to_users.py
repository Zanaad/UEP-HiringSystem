"""add password and role columns to users

Revision ID: 0002_user_auth
Revises: 0001_create_users
Create Date: 2026-08-08 00:00:00
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_user_auth"
down_revision = "0001_create_users"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_columns = {col["name"] for col in inspector.get_columns("users")}

    if "password_hash" not in existing_columns:
        op.add_column("users", sa.Column("password_hash", sa.String(length=255), nullable=False, server_default=""))

    if "role" not in existing_columns:
        op.add_column("users", sa.Column("role", sa.String(length=50), nullable=False, server_default="candidate"))


def downgrade() -> None:
    op.drop_column("users", "role")
    op.drop_column("users", "password_hash")
