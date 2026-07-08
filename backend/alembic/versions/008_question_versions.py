"""add question_versions audit table

Revision ID: 008
Revises: 007
Create Date: 2026-07-08
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "question_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("levels", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("edited_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("edited_by_label", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["question_id"], ["questions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["edited_by"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_question_versions_question_id", "question_versions", ["question_id"])
    # Framework tables are not tenant-scoped; no RLS policy (consistent with
    # questions / dimensions / competency_levels).


def downgrade() -> None:
    op.drop_index("ix_question_versions_question_id", table_name="question_versions")
    op.drop_table("question_versions")
