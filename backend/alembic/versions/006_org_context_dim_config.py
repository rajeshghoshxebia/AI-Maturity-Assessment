"""add org_context to assessments and active_dimension_codes to org_units

Revision ID: 006
Revises: 005
Create Date: 2026-07-02
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "assessments",
        sa.Column("org_context", sa.Text(), nullable=True),
    )
    op.add_column(
        "org_units",
        sa.Column("active_dimension_codes", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("org_units", "active_dimension_codes")
    op.drop_column("assessments", "org_context")
