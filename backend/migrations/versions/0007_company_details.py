"""company details

Revision ID: 0007_company_details
Revises: 0006_mock_interviews
Create Date: 2026-11-04 00:00:00
"""

import sqlalchemy as sa
from alembic import op

revision = "0007_company_details"
down_revision = "0006_mock_interviews"
branch_labels = None
depends_on = None

COLUMNS = [("website", 255), ("industry", 120), ("size", 20), ("location", 120)]


def upgrade() -> None:
    for name, length in COLUMNS:
        op.add_column("companies", sa.Column(name, sa.String(length=length)))


def downgrade() -> None:
    for name, _ in reversed(COLUMNS):
        op.drop_column("companies", name)
