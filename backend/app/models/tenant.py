import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.assessment import Assessment


class Tenant(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    azure_tenant_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

    users: Mapped[list["User"]] = relationship("User", back_populates="tenant")
    assessments: Mapped[list["Assessment"]] = relationship("Assessment", back_populates="tenant")
