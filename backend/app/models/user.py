import uuid
import enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.tenant import Tenant


class UserRole(str, enum.Enum):
    """Application roles (AIMA spec taxonomy).

    Migration 007 maps the previous values:
    PLATFORM_ADMIN→ADMINISTRATOR, ORG_ADMIN→PC_ORGANIZATION,
    CONSULTANT→ASSESSMENT_CONSULTANT, STAKEHOLDER→MEMBER, VIEWER→VIEWER.
    """

    ADMINISTRATOR = "ADMINISTRATOR"
    PC_ORGANIZATION = "PC_ORGANIZATION"
    PC_BUSINESS_UNIT = "PC_BUSINESS_UNIT"
    PC_TEAM = "PC_TEAM"
    ASSESSMENT_CONSULTANT = "ASSESSMENT_CONSULTANT"
    MEMBER = "MEMBER"
    VIEWER = "VIEWER"


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    azure_oid: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.ASSESSMENT_CONSULTANT)
    magic_link_token: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # ── Admin-managed credentials (app-native login) ───────────────────────────
    username: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Scoping anchor for PC-BU / PC-Team / Member roles
    primary_org_unit_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("org_units.id", ondelete="SET NULL"), nullable=True
    )

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="users")
