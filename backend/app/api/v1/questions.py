from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import CurrentUser
from app.core.permissions import ADMIN, CONSULTANT, require_roles
from app.db.session import get_db
from app.models.question import Question, CompetencyLevel
from app.models.question_version import QuestionVersion
from app.schemas.dimension import QuestionOut

router = APIRouter()

# Question Bank editing is available to Administrators and Assessment Consultants.
_editor = require_roles(ADMIN, CONSULTANT)


class CompetencyLevelUpdate(BaseModel):
    level: int
    description: str


class QuestionUpdate(BaseModel):
    text: str | None = None
    levels: list[CompetencyLevelUpdate] | None = None


class QuestionVersionOut(BaseModel):
    id: UUID
    text: str
    levels: list | None
    edited_by_label: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


def _snapshot(q: Question, user: CurrentUser) -> QuestionVersion:
    return QuestionVersion(
        question_id=q.id,
        text=q.text,
        levels=[{"level": cl.level, "description": cl.description} for cl in sorted(q.competency_levels, key=lambda c: c.level)],
        edited_by=user.user_id,
        edited_by_label=user.email or str(user.user_id),
    )


@router.patch("/{question_id}", response_model=QuestionOut)
async def update_question(
    question_id: UUID,
    body: QuestionUpdate,
    user: CurrentUser = Depends(_editor),
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

    await db.flush()
    # reload competency_levels so the snapshot reflects the new state
    q = (await db.execute(stmt)).scalar_one()
    db.add(_snapshot(q, user))

    await db.commit()
    q = (await db.execute(stmt)).scalar_one()
    return QuestionOut.model_validate(q)


@router.get("/{question_id}/versions", response_model=list[QuestionVersionOut])
async def list_question_versions(
    question_id: UUID,
    _: CurrentUser = Depends(_editor),
    db: AsyncSession = Depends(get_db),
) -> list[QuestionVersionOut]:
    rows = (await db.execute(
        select(QuestionVersion)
        .where(QuestionVersion.question_id == question_id)
        .order_by(QuestionVersion.created_at.desc())
    )).scalars().all()
    return [QuestionVersionOut.model_validate(v) for v in rows]
