from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ResponseUpsert(BaseModel):
    question_id: UUID
    score: int = Field(ge=1, le=5)
    observations: str | None = None
    org_unit_id: UUID | None = None


class ResponseBulkUpsert(BaseModel):
    responses: list[ResponseUpsert]


class ResponseOut(BaseModel):
    id: UUID
    question_id: UUID
    score: int
    observations: str | None
    answered_at: datetime
    org_unit_id: UUID | None = None

    model_config = {"from_attributes": True}


class DimensionScoreOut(BaseModel):
    code: str
    name: str
    score: float
    label: str
    response_count: int


class ScoreOut(BaseModel):
    overall_score: float
    maturity_label: str
    dimensions: list[DimensionScoreOut]


class UnitScoreOut(BaseModel):
    unit_id: str
    unit_name: str
    unit_type: str
    overall_score: float
    maturity_label: str
    dimensions: list[DimensionScoreOut]
    children: list[UnitScoreOut] = []

    model_config = {"from_attributes": True}


UnitScoreOut.model_rebuild()


class HierarchyScoreOut(BaseModel):
    org_name: str
    org_industry: str | None
    overall_score: float
    maturity_label: str
    dimensions: list[DimensionScoreOut]
    units: list[UnitScoreOut]
