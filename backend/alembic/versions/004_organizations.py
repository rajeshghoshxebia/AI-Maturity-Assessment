"""add organizations and org_units tables

Revision ID: 004
Revises: 003
Create Date: 2024-01-01
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("industry", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_organizations_tenant_id", "organizations", ["tenant_id"])

    op.create_table(
        "org_units",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("org_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("org_units.id", ondelete="CASCADE"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("unit_type", sa.String(50), nullable=False, server_default="TEAM"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("competency_codes", postgresql.JSON(), nullable=False, server_default="[]"),
    )
    op.create_index("ix_org_units_org_id", "org_units", ["org_id"])

    op.add_column("assessments", sa.Column(
        "org_id", postgresql.UUID(as_uuid=True),
        sa.ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True
    ))
    op.add_column("assessments", sa.Column(
        "org_unit_id", postgresql.UUID(as_uuid=True),
        sa.ForeignKey("org_units.id", ondelete="SET NULL"), nullable=True
    ))
    op.create_index("ix_assessments_org_id", "assessments", ["org_id"])


def downgrade() -> None:
    op.drop_index("ix_assessments_org_id", "assessments")
    op.drop_column("assessments", "org_unit_id")
    op.drop_column("assessments", "org_id")
    op.drop_table("org_units")
    op.drop_table("organizations")
