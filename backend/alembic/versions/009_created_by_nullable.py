"""make assessments.created_by nullable so users can be hard-deleted

Revision ID: 009
Revises: 008
Create Date: 2026-07-13
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "assessments", "created_by",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "assessments", "created_by",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )
