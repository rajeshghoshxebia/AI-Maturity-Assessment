from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ResponseUpsert(BaseModel):
    question_id: UUID
    score: int = Field(ge=1, le=5)
    observations: str | None = None


class ResponseBulkUpsert(BaseModel):
    responses: list[ResponseUpsert]


class ResponseOut(BaseModel):
    id: UUID
    question_id: UUID
    score: int
    observations: str | None
    answered_at: datetime

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
