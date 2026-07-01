from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.assessment import AssessmentMode, AssessmentStatus


class AssessmentCreate(BaseModel):
    organization_name: str = Field(min_length=1, max_length=255)
    mode: AssessmentMode = AssessmentMode.CONSULTANT
    notes: str | None = None
    active_subcategory_codes: list[str] = Field(default_factory=list)
    org_id: UUID | None = None
    org_unit_id: UUID | None = None


class AssessmentUpdate(BaseModel):
    organization_name: str | None = Field(default=None, max_length=255)
    notes: str | None = None
    status: AssessmentStatus | None = None
    active_subcategory_codes: list[str] | None = None


class SubcategoryRefOut(BaseModel):
    id: UUID
    code: str
    name: str

    model_config = {"from_attributes": True}


class AssessmentOut(BaseModel):
    id: UUID
    tenant_id: UUID
    organization_name: str
    mode: AssessmentMode
    status: AssessmentStatus
    notes: str | None
    created_at: datetime
    completed_at: datetime | None
    active_subcategories: list[SubcategoryRefOut] = []
    org_id: UUID | None = None
    org_unit_id: UUID | None = None

    model_config = {"from_attributes": True}


class AssessmentListOut(BaseModel):
    id: UUID
    organization_name: str
    mode: AssessmentMode
    status: AssessmentStatus
    created_at: datetime

    model_config = {"from_attributes": True}
