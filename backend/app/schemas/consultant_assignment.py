from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ConsultantAssignmentCreate(BaseModel):
    person_id: UUID
    organization_id: UUID


class ConsultantAssignmentUpdate(BaseModel):
    active: bool


class ConsultantAssignmentOut(BaseModel):
    id: UUID
    person_id: UUID
    organization_id: UUID
    active: bool
    assigned_date: datetime | None = None
    # Denormalised display fields
    consultant_name: str | None = None
    consultant_username: str | None = None
    consultant_email: str | None = None
    organization_name: str | None = None
