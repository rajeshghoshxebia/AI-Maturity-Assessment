from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import selectinload

from app.models.response import Response
from app.models.question import Question
from app.repositories.base import BaseRepository


class ResponseRepository(BaseRepository[Response]):
    model = Response

    async def get_for_assessment(self, assessment_id: UUID) -> list[Response]:
        stmt = (
            select(Response)
            .where(Response.assessment_id == assessment_id)
            .options(selectinload(Response.question))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def upsert(
        self,
        assessment_id: UUID,
        question_id: UUID,
        score: int,
        observations: str | None,
        respondent_id: UUID | None = None,
    ) -> Response:
        stmt = select(Response).where(
            Response.assessment_id == assessment_id,
            Response.question_id == question_id,
        )
        result = await self.session.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            existing.score = score
            existing.observations = observations
            await self.session.flush()
            return existing
        new_response = Response(
            assessment_id=assessment_id,
            question_id=question_id,
            score=score,
            observations=observations,
            respondent_id=respondent_id,
        )
        self.session.add(new_response)
        await self.session.flush()
        return new_response
