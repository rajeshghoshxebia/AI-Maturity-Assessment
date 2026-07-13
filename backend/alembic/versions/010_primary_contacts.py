"""add primary_contact_id to organizations and org_units

Revision ID: 010
Revises: 009
Create Date: 2026-07-13
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("organizations", sa.Column("primary_contact_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_orgs_primary_contact", "organizations", "users",
        ["primary_contact_id"], ["id"], ondelete="SET NULL",
    )
    op.add_column("org_units", sa.Column("primary_contact_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_org_units_primary_contact", "org_units", "users",
        ["primary_contact_id"], ["id"], ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_org_units_primary_contact", "org_units", type_="foreignkey")
    op.drop_column("org_units", "primary_contact_id")
    op.drop_constraint("fk_orgs_primary_contact", "organizations", type_="foreignkey")
    op.drop_column("organizations", "primary_contact_id")
