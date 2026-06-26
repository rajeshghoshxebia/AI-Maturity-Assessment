"""Survey invitations table and invitation_id on responses

Revision ID: 002
Revises: 001
Create Date: 2026-06-26
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "survey_invitations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("token", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDING"),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.add_column(
        "responses",
        sa.Column("invitation_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("survey_invitations.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_responses_invitation_id", "responses", ["invitation_id"])


def downgrade() -> None:
    op.drop_index("ix_responses_invitation_id", table_name="responses")
    op.drop_column("responses", "invitation_id")
    op.drop_table("survey_invitations")
