from uuid import UUID
from pydantic import BaseModel, Field


class CompetencyLevelOut(BaseModel):
    level: int
    description: str

    model_config = {"from_attributes": True}


class QuestionOut(BaseModel):
    id: UUID
    text: str
    order: int
    weight: float
    subcategory_id: UUID | None = None
    levels: list[CompetencyLevelOut] = Field(validation_alias="competency_levels")

    model_config = {"from_attributes": True, "populate_by_name": True}


class TechSubcategoryOut(BaseModel):
    id: UUID
    code: str
    name: str
    description: str | None = None
    order: int

    model_config = {"from_attributes": True}


class DimensionOut(BaseModel):
    id: UUID
    code: str
    name: str
    tag: str | None
    description: str | None
    what_is_assessed: str | None = None
    order: int
    is_optional: bool
    questions: list[QuestionOut]
    subcategories: list[TechSubcategoryOut]

    model_config = {"from_attributes": True}
