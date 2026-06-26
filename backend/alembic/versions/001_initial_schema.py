"""Initial schema with RLS

Revision ID: 001
Revises:
Create Date: 2025-06-26
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- tenants ---
    op.create_table(
        "tenants",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("azure_tenant_id", sa.String(255), unique=True, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("azure_oid", sa.String(255), unique=True, nullable=True),
        sa.Column("role", sa.Enum("PLATFORM_ADMIN","ORG_ADMIN","CONSULTANT","STAKEHOLDER","VIEWER", name="userrole"), nullable=False),
        sa.Column("magic_link_token", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"])
    op.create_index("ix_users_email", "users", ["email"])

    # --- dimensions (seeded, no tenant_id) ---
    op.create_table(
        "dimensions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(50), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("tag", sa.String(100), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("what_is_assessed", sa.Text, nullable=True),
        sa.Column("order", sa.Integer, nullable=False),
        sa.Column("is_optional", sa.Boolean, default=False, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- tech_subcategories ---
    op.create_table(
        "tech_subcategories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("dimension_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dimensions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("code", sa.String(50), unique=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("order", sa.Integer, nullable=False),
    )

    # --- questions ---
    op.create_table(
        "questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("dimension_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dimensions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subcategory_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tech_subcategories.id", ondelete="SET NULL"), nullable=True),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("order", sa.Integer, nullable=False),
        sa.Column("weight", sa.Numeric(6, 4), nullable=False),
    )
    op.create_index("ix_questions_dimension_id", "questions", ["dimension_id"])

    # --- competency_levels ---
    op.create_table(
        "competency_levels",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("level", sa.SmallInteger, nullable=False),
        sa.Column("description", sa.Text, nullable=False),
    )
    op.create_index("ix_competency_levels_question_id", "competency_levels", ["question_id"])

    # --- assessments ---
    op.create_table(
        "assessments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=False),
        sa.Column("organization_name", sa.String(255), nullable=False),
        sa.Column("mode", sa.Enum("CONSULTANT","SURVEY", name="assessmentmode"), nullable=False),
        sa.Column("status", sa.Enum("DRAFT","IN_PROGRESS","COMPLETED","ARCHIVED", name="assessmentstatus"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_assessments_tenant_id", "assessments", ["tenant_id"])

    # --- assessment_subcategories ---
    op.create_table(
        "assessment_subcategories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("subcategory_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tech_subcategories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("is_active", sa.Boolean, default=True, nullable=False),
    )
    op.create_index("ix_assessment_subcategories_assessment_id", "assessment_subcategories", ["assessment_id"])

    # --- responses ---
    op.create_table(
        "responses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("respondent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("score", sa.SmallInteger, nullable=False),
        sa.Column("observations", sa.Text, nullable=True),
        sa.Column("answered_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_responses_assessment_id", "responses", ["assessment_id"])
    op.create_index("ix_responses_question_id", "responses", ["question_id"])

    # --- survey_assignments ---
    op.create_table(
        "survey_assignments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("dimension_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dimensions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("invited_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_survey_assignments_assessment_id", "survey_assignments", ["assessment_id"])

    # ── Row-Level Security ──────────────────────────────────────────────────
    # Tenant-scoped tables enforce RLS via a session-level variable set by the
    # application before any query: SET LOCAL app.current_tenant_id = '<uuid>'
    for table in ("users", "assessments", "assessment_subcategories", "responses", "survey_assignments"):
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")

    op.execute("""
        CREATE POLICY tenant_isolation ON users
        USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
    """)
    op.execute("""
        CREATE POLICY tenant_isolation ON assessments
        USING (tenant_id = current_setting('app.current_tenant_id')::uuid)
    """)
    op.execute("""
        CREATE POLICY tenant_isolation ON assessment_subcategories
        USING (
            assessment_id IN (
                SELECT id FROM assessments
                WHERE tenant_id = current_setting('app.current_tenant_id')::uuid
            )
        )
    """)
    op.execute("""
        CREATE POLICY tenant_isolation ON responses
        USING (
            assessment_id IN (
                SELECT id FROM assessments
                WHERE tenant_id = current_setting('app.current_tenant_id')::uuid
            )
        )
    """)
    op.execute("""
        CREATE POLICY tenant_isolation ON survey_assignments
        USING (
            assessment_id IN (
                SELECT id FROM assessments
                WHERE tenant_id = current_setting('app.current_tenant_id')::uuid
            )
        )
    """)


def downgrade() -> None:
    for table in ("users", "assessments", "assessment_subcategories", "responses", "survey_assignments"):
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation ON {table}")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")

    for table in (
        "survey_assignments", "responses", "assessment_subcategories",
        "assessments", "competency_levels", "questions",
        "tech_subcategories", "dimensions", "users", "tenants",
    ):
        op.drop_table(table)

    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS assessmentmode")
    op.execute("DROP TYPE IF EXISTS assessmentstatus")
