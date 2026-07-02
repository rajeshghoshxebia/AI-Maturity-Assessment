from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class OrgUnitCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    unit_type: str = "TEAM"
    parent_id: UUID | None = None
    sort_order: int = 0
    competency_codes: list[str] = Field(default_factory=list)
    active_dimension_codes: list[str] | None = None


class OrgUnitUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    unit_type: str | None = None
    parent_id: UUID | None = None
    sort_order: int | None = None
    competency_codes: list[str] | None = None
    active_dimension_codes: list[str] | None = None


class OrgUnitOut(BaseModel):
    id: UUID
    org_id: UUID
    parent_id: UUID | None
    name: str
    unit_type: str
    sort_order: int
    competency_codes: list[str]
    active_dimension_codes: list[str] | None = None
    children: list[OrgUnitOut] = []

    model_config = {"from_attributes": True}


OrgUnitOut.model_rebuild()


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    industry: str | None = Field(default=None, max_length=100)


class OrganizationUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    industry: str | None = Field(default=None, max_length=100)


class OrganizationOut(BaseModel):
    id: UUID
    tenant_id: UUID
    name: str
    industry: str | None
    created_at: datetime
    updated_at: datetime
    units: list[OrgUnitOut] = []

    model_config = {"from_attributes": True}


class OrganizationListOut(BaseModel):
    id: UUID
    name: str
    industry: str | None
    created_at: datetime
    unit_count: int = 0

    model_config = {"from_attributes": True}
