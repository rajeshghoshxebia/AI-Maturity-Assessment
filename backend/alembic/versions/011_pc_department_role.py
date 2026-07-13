"""add PC_DEPARTMENT to the userrole enum

Revision ID: 011
Revises: 010
Create Date: 2026-07-13
"""
from alembic import op

revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # New enum value; only added here (not used in this migration), so it is
    # safe inside the transaction on PostgreSQL 12+.
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'PC_DEPARTMENT'")


def downgrade() -> None:
    # Postgres cannot drop an enum value; leave it in place.
    pass
