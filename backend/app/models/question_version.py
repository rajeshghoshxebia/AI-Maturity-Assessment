import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin

if TYPE_CHECKING:
    pass


class QuestionVersion(UUIDMixin, Base):
    """Immutable snapshot of a Question captured on every edit.

    Provides an audit trail: what the question text and rating-level descriptions
    were, when the change was made, and which user made it.
    """

    __tablename__ = "question_versions"

    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    # Snapshot of competency levels: [{"level": int, "description": str}, ...]
    levels: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    edited_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    edited_by_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
