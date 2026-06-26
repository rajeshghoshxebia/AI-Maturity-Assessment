from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.dimension import Dimension, TechSubcategory
from app.models.question import Question, CompetencyLevel
from app.repositories.base import BaseRepository


class DimensionRepository(BaseRepository[Dimension]):
    model = Dimension

    async def list_all_with_questions(self) -> list[Dimension]:
        stmt = (
            select(Dimension)
            .options(
                selectinload(Dimension.questions).selectinload(Question.competency_levels),
                selectinload(Dimension.subcategories).selectinload(
                    TechSubcategory.questions
                ).selectinload(Question.competency_levels),
            )
            .order_by(Dimension.order)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())

    async def get_subcategory_by_code(self, code: str) -> TechSubcategory | None:
        stmt = select(TechSubcategory).where(TechSubcategory.code == code)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
