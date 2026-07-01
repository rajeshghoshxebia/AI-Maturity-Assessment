import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.tenant import Tenant
    from app.models.user import User
    from app.models.response import Response, SurveyAssignment
    from app.models.dimension import TechSubcategory
    from app.models.survey import SurveyInvitation
    from app.models.organization import Organization, OrgUnit


class AssessmentMode(str, enum.Enum):
    CONSULTANT = "CONSULTANT"
    SURVEY = "SURVEY"


class AssessmentStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class Assessment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "assessments"

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=False
    )
    org_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    org_unit_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("org_units.id", ondelete="SET NULL"), nullable=True
    )
    per_team: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    organization_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mode: Mapped[AssessmentMode] = mapped_column(Enum(AssessmentMode), nullable=False, default=AssessmentMode.CONSULTANT)
    status: Mapped[AssessmentStatus] = mapped_column(Enum(AssessmentStatus), nullable=False, default=AssessmentStatus.DRAFT)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="assessments")
    creator: Mapped["User"] = relationship("User")
    organization: Mapped["Organization | None"] = relationship("Organization", back_populates="assessments")
    org_unit: Mapped["OrgUnit | None"] = relationship("OrgUnit", back_populates="assessments")
    responses: Mapped[list["Response"]] = relationship("Response", back_populates="assessment")
    survey_assignments: Mapped[list["SurveyAssignment"]] = relationship("SurveyAssignment", back_populates="assessment")
    active_subcategories: Mapped[list["AssessmentSubcategory"]] = relationship(
        "AssessmentSubcategory", back_populates="assessment"
    )
    invitations: Mapped[list["SurveyInvitation"]] = relationship(
        "SurveyInvitation", back_populates="assessment", order_by="SurveyInvitation.created_at"
    )


class AssessmentSubcategory(UUIDMixin, Base):
    __tablename__ = "assessment_subcategories"

    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    subcategory_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tech_subcategories.id", ondelete="CASCADE"), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="active_subcategories")
    subcategory: Mapped["TechSubcategory"] = relationship("TechSubcategory")
