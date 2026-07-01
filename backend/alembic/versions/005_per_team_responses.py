"""add per_team to assessments and org_unit_id to responses

Revision ID: 005
Revises: 004
Create Date: 2026-07-01
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "assessments",
        sa.Column("per_team", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "responses",
        sa.Column(
            "org_unit_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("org_units.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_responses_org_unit_id", "responses", ["org_unit_id"])


def downgrade() -> None:
    op.drop_index("ix_responses_org_unit_id", "responses")
    op.drop_column("responses", "org_unit_id")
    op.drop_column("assessments", "per_team")
