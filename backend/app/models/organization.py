from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.assessment import Assessment


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Organization-level Primary Contact (PC_ORGANIZATION) — sees the whole org.
    primary_contact_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    units: Mapped[list[OrgUnit]] = relationship(
        "OrgUnit", back_populates="organization", cascade="all, delete-orphan", lazy="select"
    )
    assessments: Mapped[list["Assessment"]] = relationship("Assessment", back_populates="organization")


class OrgUnit(Base):
    __tablename__ = "org_units"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("org_units.id", ondelete="CASCADE"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    unit_type: Mapped[str] = mapped_column(String(50), nullable=False, default="TEAM")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    competency_codes: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    active_dimension_codes: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    # Primary Contact for this unit (PC_BUSINESS_UNIT / PC_TEAM) — sees this
    # unit and everything beneath it.
    primary_contact_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    organization: Mapped[Organization] = relationship("Organization", back_populates="units")
    parent: Mapped[OrgUnit | None] = relationship(
        "OrgUnit", remote_side="OrgUnit.id", back_populates="children", foreign_keys="OrgUnit.parent_id"
    )
    children: Mapped[list[OrgUnit]] = relationship(
        "OrgUnit", back_populates="parent", cascade="all, delete-orphan", foreign_keys="OrgUnit.parent_id"
    )
    assessments: Mapped[list["Assessment"]] = relationship("Assessment", back_populates="org_unit")
