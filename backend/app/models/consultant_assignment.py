import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.organization import Organization


class ConsultantAssignment(UUIDMixin, TimestampMixin, Base):
    """Links an Assessment Consultant (Person) to a client Organization.

    A consultant may be assigned to many organizations; an organization may
    have many consultants. Deactivating (active=False) revokes access without
    deleting history.
    """

    __tablename__ = "consultant_assignments"
    __table_args__ = (
        UniqueConstraint("person_id", "organization_id", name="uq_consultant_org"),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    person_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    assigned_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    person: Mapped["User"] = relationship("User", foreign_keys=[person_id])
    organization: Mapped["Organization"] = relationship("Organization")
