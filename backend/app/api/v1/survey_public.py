"""Public survey endpoints — no authentication required, uses token from invitation."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.assessment import Assessment
from app.models.question import Question
from app.models.response import Response
from app.models.survey import SurveyInvitation
from app.repositories.dimension import DimensionRepository
from app.schemas.dimension import DimensionOut

router = APIRouter()


class SurveyMeta(BaseModel):
    assessment_id: UUID
    organization_name: str
    invitee_name: str | None
    invitee_email: str
    status: str
    dimensions: list[DimensionOut]


class SurveyResponseIn(BaseModel):
    question_id: UUID
    score: int
    observations: str | None = None


class SurveySubmitIn(BaseModel):
    responses: list[SurveyResponseIn]


async def _get_active_invitation(token: UUID, db: AsyncSession) -> SurveyInvitation:
    result = await db.execute(
        select(SurveyInvitation).where(SurveyInvitation.token == token)
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Survey link not found")
    if inv.status == "REVOKED":
        raise HTTPException(status_code=410, detail="This survey link has been revoked")
    return inv


@router.get("/{token}", response_model=SurveyMeta)
async def get_survey(token: UUID, db: AsyncSession = Depends(get_db)) -> SurveyMeta:
    inv = await _get_active_invitation(token, db)

    result = await db.execute(select(Assessment).where(Assessment.id == inv.assessment_id))
    assessment = result.scalar_one_or_none()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    dim_repo = DimensionRepository(db)
    dims = await dim_repo.list_all_with_questions()

    # Filter TECHNOLOGY_STACK to active subcategories (reuse assessment logic)
    from sqlalchemy.orm import selectinload as sil
    from app.models.assessment import AssessmentSubcategory
    subs_result = await db.execute(
        select(AssessmentSubcategory)
        .where(AssessmentSubcategory.assessment_id == assessment.id)
        .options(sil(AssessmentSubcategory.subcategory))
    )
    active_codes = {asc.subcategory.code for asc in subs_result.scalars().all() if asc.subcategory}

    filtered = []
    for d in dims:
        if d.code == "TECHNOLOGY_STACK":
            d.questions = [
                q for q in d.questions
                if any(
                    sub.code in active_codes
                    for sub in d.subcategories
                    if sub.id == q.subcategory_id
                )
            ]
            if not d.questions:
                continue
        filtered.append(d)

    return SurveyMeta(
        assessment_id=assessment.id,
        organization_name=assessment.organization_name,
        invitee_name=inv.name,
        invitee_email=inv.email,
        status=inv.status,
        dimensions=[DimensionOut.model_validate(d) for d in filtered],
    )


@router.post("/{token}/submit")
async def submit_survey(
    token: UUID,
    body: SurveySubmitIn,
    db: AsyncSession = Depends(get_db),
) -> dict:
    inv = await _get_active_invitation(token, db)

    if inv.status == "COMPLETED":
        raise HTTPException(status_code=409, detail="Survey already submitted")

    for r in body.responses:
        if not (1 <= r.score <= 5):
            raise HTTPException(status_code=422, detail=f"Score must be 1–5 (got {r.score})")

        # Upsert per (assessment_id, question_id, invitation_id)
        existing = await db.execute(
            select(Response).where(
                Response.assessment_id == inv.assessment_id,
                Response.question_id == r.question_id,
                Response.invitation_id == inv.id,
            )
        )
        resp = existing.scalar_one_or_none()
        if resp:
            resp.score = r.score
            resp.observations = r.observations
        else:
            db.add(Response(
                assessment_id=inv.assessment_id,
                question_id=r.question_id,
                score=r.score,
                observations=r.observations,
                invitation_id=inv.id,
            ))

    inv.status = "COMPLETED"
    inv.completed_at = datetime.now(timezone.utc)
    await db.commit()

    return {"message": "Thank you! Your responses have been recorded."}
