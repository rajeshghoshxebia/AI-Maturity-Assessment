from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.assessment import Assessment, AssessmentSubcategory
from app.models.dimension import TechSubcategory
from app.repositories.base import BaseRepository


def _subcategory_load():
    return selectinload(Assessment.active_subcategories).selectinload(
        AssessmentSubcategory.subcategory
    )


class AssessmentRepository(BaseRepository[Assessment]):
    model = Assessment

    async def get_with_relations(self, id: UUID, tenant_id: UUID) -> Assessment | None:
        stmt = (
            select(Assessment)
            .where(Assessment.id == id, Assessment.tenant_id == tenant_id)
            .options(_subcategory_load())
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_for_tenant(self, tenant_id: UUID) -> list[Assessment]:
        stmt = (
            select(Assessment)
            .where(Assessment.tenant_id == tenant_id)
            .options(_subcategory_load())
            .order_by(Assessment.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def set_subcategories(
        self, assessment_id: UUID, subcategory_ids: list[UUID]
    ) -> None:
        stmt = select(AssessmentSubcategory).where(
            AssessmentSubcategory.assessment_id == assessment_id
        )
        result = await self.session.execute(stmt)
        existing = {row.subcategory_id: row for row in result.scalars().all()}
        for sub_id in subcategory_ids:
            if sub_id not in existing:
                self.session.add(
                    AssessmentSubcategory(assessment_id=assessment_id, subcategory_id=sub_id, is_active=True)
                )
        for sub_id, row in existing.items():
            if sub_id not in subcategory_ids:
                await self.session.delete(row)
        await self.session.flush()
