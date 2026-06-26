import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin

if TYPE_CHECKING:
    from app.models.dimension import Dimension, TechSubcategory
    from app.models.response import Response


class Question(UUIDMixin, Base):
    __tablename__ = "questions"

    dimension_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dimensions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    subcategory_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tech_subcategories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False)
    weight: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False)

    dimension: Mapped["Dimension"] = relationship("Dimension", back_populates="questions")
    subcategory: Mapped["TechSubcategory | None"] = relationship("TechSubcategory", back_populates="questions")
    competency_levels: Mapped[list["CompetencyLevel"]] = relationship(
        "CompetencyLevel", back_populates="question", order_by="CompetencyLevel.level"
    )
    responses: Mapped[list["Response"]] = relationship("Response", back_populates="question")


class CompetencyLevel(UUIDMixin, Base):
    __tablename__ = "competency_levels"

    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    level: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    description: Mapped[str] = mapped_column(Text, nullable=False)

    question: Mapped["Question"] = relationship("Question", back_populates="competency_levels")
