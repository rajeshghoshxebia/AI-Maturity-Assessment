import uuid as _uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.base import Base, UUIDMixin

if TYPE_CHECKING:
    from app.models.assessment import Assessment


class SurveyInvitation(UUIDMixin, Base):
    __tablename__ = "survey_invitations"

    assessment_id: Mapped[_uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    token: Mapped[_uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, unique=True, default=_uuid.uuid4
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="PENDING")
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="invitations")
