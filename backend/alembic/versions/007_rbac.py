"""RBAC: rename roles, add credentials to users, consultant_assignments, users RLS carve-out

Revision ID: 007
Revises: 006
Create Date: 2026-07-07
"""
import sqlalchemy as sa
from alembic import op

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None

_OLD_ROLES = ("PLATFORM_ADMIN", "ORG_ADMIN", "CONSULTANT", "STAKEHOLDER", "VIEWER")
_NEW_ROLES = (
    "ADMINISTRATOR", "PC_ORGANIZATION", "PC_BUSINESS_UNIT", "PC_TEAM",
    "ASSESSMENT_CONSULTANT", "MEMBER", "VIEWER",
)
_ROLE_MAP = {
    "PLATFORM_ADMIN": "ADMINISTRATOR",
    "ORG_ADMIN": "PC_ORGANIZATION",
    "CONSULTANT": "ASSESSMENT_CONSULTANT",
    "STAKEHOLDER": "MEMBER",
    "VIEWER": "VIEWER",
}


def upgrade() -> None:
    # ── 1. Migrate the userrole enum to the new taxonomy ───────────────────
    # Add the new values to the existing enum, remap rows, then drop old values
    # by recreating the type (Postgres cannot DROP enum values directly).
    op.execute("ALTER TYPE userrole RENAME TO userrole_old")
    new_enum = sa.Enum(*_NEW_ROLES, name="userrole")
    new_enum.create(op.get_bind(), checkfirst=True)

    # Column currently uses userrole_old; switch it to text, remap, then to new enum.
    op.execute("ALTER TABLE users ALTER COLUMN role DROP DEFAULT")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE text USING role::text")
    for old, new in _ROLE_MAP.items():
        op.execute(f"UPDATE users SET role = '{new}' WHERE role = '{old}'")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole")
    op.execute("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'ASSESSMENT_CONSULTANT'")
    op.execute("DROP TYPE userrole_old")

    # ── 2. Credential + scoping columns on users ───────────────────────────
    op.add_column("users", sa.Column("username", sa.String(length=64), nullable=True))
    op.add_column("users", sa.Column("password_hash", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("users", sa.Column("primary_org_unit_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True))
    op.create_unique_constraint("uq_users_username", "users", ["username"])
    op.create_index("ix_users_username", "users", ["username"])
    op.create_foreign_key(
        "fk_users_primary_org_unit", "users", "org_units",
        ["primary_org_unit_id"], ["id"], ondelete="SET NULL",
    )

    # ── 3. consultant_assignments ──────────────────────────────────────────
    op.create_table(
        "consultant_assignments",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("person_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("organization_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("assigned_by", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["person_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assigned_by"], ["users.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("person_id", "organization_id", name="uq_consultant_org"),
    )
    op.create_index("ix_consultant_assignments_tenant_id", "consultant_assignments", ["tenant_id"])
    op.create_index("ix_consultant_assignments_person_id", "consultant_assignments", ["person_id"])
    op.create_index("ix_consultant_assignments_organization_id", "consultant_assignments", ["organization_id"])

    # RLS on the new table, consistent with the rest of the schema.
    op.execute("ALTER TABLE consultant_assignments ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE consultant_assignments FORCE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenant_isolation ON consultant_assignments
        USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
    """)

    # ── 4. users RLS carve-out for credential login ────────────────────────
    # The login lookup runs before any tenant context is known. Allow reads on
    # users when no tenant GUC is set; otherwise enforce tenant isolation.
    op.execute("DROP POLICY IF EXISTS tenant_isolation ON users")
    op.execute("""
        CREATE POLICY tenant_isolation ON users
        USING (
            current_setting('app.current_tenant_id', true) IS NULL
            OR current_setting('app.current_tenant_id', true) = ''
            OR tenant_id = current_setting('app.current_tenant_id')::uuid
        )
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS tenant_isolation ON users")
    op.execute("""
        CREATE POLICY tenant_isolation ON users
        USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
    """)

    op.drop_table("consultant_assignments")

    op.drop_constraint("fk_users_primary_org_unit", "users", type_="foreignkey")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_constraint("uq_users_username", "users", type_="unique")
    op.drop_column("users", "primary_org_unit_id")
    op.drop_column("users", "is_active")
    op.drop_column("users", "password_hash")
    op.drop_column("users", "username")

    # Revert enum to the old taxonomy.
    op.execute("ALTER TYPE userrole RENAME TO userrole_new")
    old_enum = sa.Enum(*_OLD_ROLES, name="userrole")
    old_enum.create(op.get_bind(), checkfirst=True)
    op.execute("ALTER TABLE users ALTER COLUMN role DROP DEFAULT")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE text USING role::text")
    reverse = {v: k for k, v in _ROLE_MAP.items()}
    for new, old in reverse.items():
        op.execute(f"UPDATE users SET role = '{old}' WHERE role = '{new}'")
    op.execute("UPDATE users SET role = 'CONSULTANT' WHERE role NOT IN %s" % (str(_OLD_ROLES),))
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole")
    op.execute("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'CONSULTANT'")
    op.execute("DROP TYPE userrole_new")
