"""Seed dev tenant and user for local/dev mode

Revision ID: 003
Revises: 002
Create Date: 2025-06-27
"""
from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None

DEV_TENANT_ID = "00000000-0000-0000-0000-000000000001"
DEV_USER_ID = "00000000-0000-0000-0000-000000000002"


def upgrade() -> None:
    op.execute(f"""
        INSERT INTO tenants (id, name, slug, azure_tenant_id)
        VALUES (
            '{DEV_TENANT_ID}',
            'Dev Tenant',
            'dev',
            NULL
        )
        ON CONFLICT (id) DO NOTHING
    """)

    op.execute(f"""
        INSERT INTO users (id, tenant_id, email, name, role)
        VALUES (
            '{DEV_USER_ID}',
            '{DEV_TENANT_ID}',
            'dev@example.com',
            'Dev User',
            'PLATFORM_ADMIN'
        )
        ON CONFLICT (id) DO NOTHING
    """)


def downgrade() -> None:
    op.execute(f"DELETE FROM users WHERE id = '{DEV_USER_ID}'")
    op.execute(f"DELETE FROM tenants WHERE id = '{DEV_TENANT_ID}'")
