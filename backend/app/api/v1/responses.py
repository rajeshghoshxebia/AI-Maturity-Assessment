from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, CurrentUser
from app.core.scoring import compute_dimension_score, compute_overall_score, maturity_label, DimensionScore
from app.core.tenant import apply_rls
from app.db.session import get_db
from app.repositories.assessment import AssessmentRepository
from app.repositories.dimension import DimensionRepository
from app.repositories.response import ResponseRepository
from app.schemas.response import ResponseBulkUpsert, ResponseOut, ScoreOut, DimensionScoreOut

router = APIRouter()


async def _check_access(
    assessment_id: UUID,
    user: CurrentUser,
    db: AsyncSession,
) -> None:
    await apply_rls(db, user.tenant_id)
    repo = AssessmentRepository(db)
    obj = await repo.get(assessment_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Assessment not found")


@router.get("", response_model=list[ResponseOut])
async def list_responses(
    assessment_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ResponseOut]:
    await _check_access(assessment_id, user, db)
    repo = ResponseRepository(db)
    items = await repo.get_for_assessment(assessment_id)
    return [ResponseOut.model_validate(r) for r in items]


@router.put("", response_model=list[ResponseOut])
async def upsert_responses(
    assessment_id: UUID,
    body: ResponseBulkUpsert,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ResponseOut]:
    await _check_access(assessment_id, user, db)
    repo = ResponseRepository(db)
    results = []
    for item in body.responses:
        r = await repo.upsert(
            assessment_id=assessment_id,
            question_id=item.question_id,
            score=item.score,
            observations=item.observations,
            respondent_id=user.user_id,
        )
        results.append(r)
    await db.commit()
    return [ResponseOut.model_validate(r) for r in results]


@router.get("/score", response_model=ScoreOut)
async def get_score(
    assessment_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ScoreOut:
    await _check_access(assessment_id, user, db)

    response_repo = ResponseRepository(db)
    dim_repo = DimensionRepository(db)

    responses = await response_repo.get_for_assessment(assessment_id)
    dimensions = await dim_repo.list_all_with_questions()

    # Map question_id → (score, weight)
    score_map: dict[UUID, tuple[int, float]] = {}
    for r in responses:
        score_map[r.question_id] = (r.score, float(r.question.weight) if r.question else 1.0)

    dimension_scores: list[DimensionScore] = []
    for dim in dimensions:
        pairs: list[tuple[float, float]] = []
        for q in dim.questions:
            if q.id in score_map:
                s, w = score_map[q.id]
                pairs.append((float(s), w))
        if pairs:
            ds = compute_dimension_score(pairs)
            ds.dimension_code = dim.code
            ds.dimension_name = dim.name
            dimension_scores.append(ds)

    overall = compute_overall_score(dimension_scores)
    return ScoreOut(
        overall_score=overall,
        maturity_label=maturity_label(overall),
        dimensions=[
            DimensionScoreOut(
                code=ds.dimension_code,
                name=ds.dimension_name,
                score=ds.score,
                label=ds.label,
                response_count=ds.response_count,
            )
            for ds in dimension_scores
        ],
    )
