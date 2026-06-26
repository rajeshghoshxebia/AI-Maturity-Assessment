from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user, CurrentUser
from app.db.session import get_db
from app.models.question import Question, CompetencyLevel
from app.schemas.dimension import QuestionOut

router = APIRouter()


class CompetencyLevelUpdate(BaseModel):
    level: int
    description: str


class QuestionUpdate(BaseModel):
    text: str | None = None
    levels: list[CompetencyLevelUpdate] | None = None


@router.patch("/{question_id}", response_model=QuestionOut)
async def update_question(
    question_id: UUID,
    body: QuestionUpdate,
    _: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> QuestionOut:
    stmt = (
        select(Question)
        .where(Question.id == question_id)
        .options(selectinload(Question.competency_levels))
    )
    result = await db.execute(stmt)
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    if body.text is not None:
        q.text = body.text

    if body.levels is not None:
        level_map = {cl.level: cl for cl in q.competency_levels}
        for lu in body.levels:
            if lu.level in level_map:
                level_map[lu.level].description = lu.description
            else:
                db.add(CompetencyLevel(question_id=q.id, level=lu.level, description=lu.description))

    await db.commit()
    await db.refresh(q)
    # reload competency_levels after refresh
    stmt2 = (
        select(Question)
        .where(Question.id == question_id)
        .options(selectinload(Question.competency_levels))
    )
    result2 = await db.execute(stmt2)
    q = result2.scalar_one()
    return QuestionOut.model_validate(q)
