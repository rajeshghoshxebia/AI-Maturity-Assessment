from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.question import Question, TechSubcategory


class Dimension(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "dimensions"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    tag: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    what_is_assessed: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, nullable=False)
    is_optional: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    questions: Mapped[list["Question"]] = relationship("Question", back_populates="dimension")
    subcategories: Mapped[list["TechSubcategory"]] = relationship("TechSubcategory", back_populates="dimension")


class TechSubcategory(UUIDMixin, Base):
    __tablename__ = "tech_subcategories"

    import uuid as _uuid
    from sqlalchemy.dialects.postgresql import UUID as _UUID
    from sqlalchemy import ForeignKey as _FK

    dimension_id: Mapped[_uuid.UUID] = mapped_column(
        _UUID(as_uuid=True), _FK("dimensions.id", ondelete="CASCADE"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, nullable=False)

    dimension: Mapped["Dimension"] = relationship("Dimension", back_populates="subcategories")
    questions: Mapped[list["Question"]] = relationship("Question", back_populates="subcategory")
