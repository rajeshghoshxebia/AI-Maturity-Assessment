from __future__ import annotations

from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user, CurrentUser
from app.core.permissions import can_edit_org, can_view_org
from app.core.scoring import compute_dimension_score, compute_overall_score, maturity_label, DimensionScore
from app.core.tenant import apply_rls
from app.db.session import get_db
from app.models.organization import Organization, OrgUnit
from app.models.response import Response
from app.repositories.assessment import AssessmentRepository
from app.repositories.dimension import DimensionRepository
from app.repositories.response import ResponseRepository
from app.schemas.response import (
    ResponseBulkUpsert, ResponseOut, ScoreOut, DimensionScoreOut,
    UnitScoreOut, HierarchyScoreOut,
)

router = APIRouter()


async def _check_access(
    assessment_id: UUID,
    user: CurrentUser,
    db: AsyncSession,
):
    await apply_rls(db, user.tenant_id)
    repo = AssessmentRepository(db)
    obj = await repo.get(assessment_id)
    # Read access: admins/consultants can view all; others limited to scope.
    if not obj or not can_view_org(user, obj.org_id):
        raise HTTPException(status_code=404, detail="Assessment not found")
    return obj


def _build_score_from_responses(
    responses: list[Response],
    dimensions: list,
) -> tuple[float, list[DimensionScore]]:
    score_map: dict[UUID, tuple[float, float]] = {}
    for r in responses:
        score_map[r.question_id] = (float(r.score), float(r.question.weight) if r.question else 1.0)

    dimension_scores: list[DimensionScore] = []
    for dim in dimensions:
        pairs = [(score_map[q.id][0], score_map[q.id][1]) for q in dim.questions if q.id in score_map]
        if pairs:
            ds = compute_dimension_score(pairs)
            ds.dimension_code = dim.code
            ds.dimension_name = dim.name
            dimension_scores.append(ds)

    overall = compute_overall_score(dimension_scores)
    return overall, dimension_scores


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
    obj = await _check_access(assessment_id, user, db)
    if not can_edit_org(user, obj.org_id):
        raise HTTPException(status_code=403, detail="You can only conduct assessments for your assigned organizations")
    repo = ResponseRepository(db)
    results = []
    for item in body.responses:
        r = await repo.upsert(
            assessment_id=assessment_id,
            question_id=item.question_id,
            score=item.score,
            observations=item.observations,
            respondent_id=user.user_id,
            org_unit_id=item.org_unit_id,
        )
        results.append(r)
    await db.commit()
    return [ResponseOut.model_validate(r) for r in results]


@router.get("/score", response_model=ScoreOut)
async def get_score(
    assessment_id: UUID,
    org_unit_id: UUID | None = None,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ScoreOut:
    await _check_access(assessment_id, user, db)

    response_repo = ResponseRepository(db)
    dim_repo = DimensionRepository(db)

    all_responses = await response_repo.get_for_assessment(assessment_id)
    responses = [r for r in all_responses if r.org_unit_id == org_unit_id] if org_unit_id is not None else all_responses

    dimensions = await dim_repo.list_all_with_questions()
    overall, dimension_scores = _build_score_from_responses(responses, dimensions)

    return ScoreOut(
        overall_score=overall,
        maturity_label=maturity_label(overall),
        dimensions=[
            DimensionScoreOut(
                code=ds.dimension_code, name=ds.dimension_name,
                score=ds.score, label=ds.label, response_count=ds.response_count,
            )
            for ds in dimension_scores
        ],
    )


@router.get("/score/hierarchy", response_model=HierarchyScoreOut)
async def get_hierarchy_score(
    assessment_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> HierarchyScoreOut:
    assessment = await _check_access(assessment_id, user, db)

    if not assessment.org_id:
        raise HTTPException(status_code=400, detail="Assessment is not linked to an organization")

    result = await db.execute(
        select(Organization)
        .where(Organization.id == assessment.org_id)
        .options(selectinload(Organization.units))
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    response_repo = ResponseRepository(db)
    dim_repo = DimensionRepository(db)

    all_responses = await response_repo.get_for_assessment(assessment_id)
    dimensions = await dim_repo.list_all_with_questions()

    by_unit: dict = defaultdict(list)
    for r in all_responses:
        by_unit[r.org_unit_id].append(r)

    all_units = {u.id: u for u in org.units}

    # Canonical dimension ordering (for stable output of averaged rollups)
    dim_order = {d.code: i for i, d in enumerate(dimensions)}
    dim_name = {d.code: d.name for d in dimensions}

    def _dim_outs(responses: list) -> tuple[float, list[DimensionScoreOut]]:
        overall, ds_list = _build_score_from_responses(responses, dimensions)
        return overall, [
            DimensionScoreOut(code=ds.dimension_code, name=ds.dimension_name,
                              score=ds.score, label=ds.label, response_count=ds.response_count)
            for ds in ds_list
        ]

    def _avg_children(children: list[UnitScoreOut]) -> tuple[float, list[DimensionScoreOut]]:
        """Roll a parent's score up as the mean of its scored children.

        Each child (team) contributes equally: a department's score is the
        average of its teams, a business unit's the average of its departments,
        and so on up the tree. Per-dimension scores average only across the
        children that actually have that dimension scored.
        """
        scored = [c for c in children if c.overall_score > 0]
        if not scored:
            return 0.0, []
        overall = round(sum(c.overall_score for c in scored) / len(scored), 2)

        by_code: dict[str, list[DimensionScoreOut]] = defaultdict(list)
        for c in scored:
            for d in c.dimensions:
                if d.response_count > 0 or d.score > 0:
                    by_code[d.code].append(d)

        dim_scores: list[DimensionScoreOut] = []
        for code, lst in by_code.items():
            avg = round(sum(d.score for d in lst) / len(lst), 2)
            dim_scores.append(DimensionScoreOut(
                code=code, name=dim_name.get(code, lst[0].name), score=avg,
                label=maturity_label(avg), response_count=sum(d.response_count for d in lst),
            ))
        dim_scores.sort(key=lambda d: dim_order.get(d.code, 999))
        return overall, dim_scores

    def _collect(unit: OrgUnit) -> list:
        children = [u for u in all_units.values() if u.parent_id == unit.id]
        resp = list(by_unit.get(unit.id, []))
        for c in children:
            resp.extend(_collect(c))
        return resp

    def _build(unit: OrgUnit) -> UnitScoreOut:
        children_units = sorted([u for u in all_units.values() if u.parent_id == unit.id], key=lambda x: x.sort_order)
        child_scores = [_build(c) for c in children_units]

        # Parents roll up as the average of their scored children; leaves (or
        # parents whose children have no scores) fall back to direct responses.
        if any(c.overall_score > 0 for c in child_scores):
            overall, dim_scores = _avg_children(child_scores)
        else:
            direct = by_unit.get(unit.id, [])
            unit_responses = direct if direct else _collect(unit)
            overall, dim_scores = _dim_outs(unit_responses)

        return UnitScoreOut(
            unit_id=str(unit.id), unit_name=unit.name, unit_type=unit.unit_type,
            overall_score=overall, maturity_label=maturity_label(overall),
            dimensions=dim_scores, children=child_scores,
        )

    root_units = sorted([u for u in org.units if u.parent_id is None], key=lambda x: x.sort_order)
    unit_trees = [_build(u) for u in root_units]

    # Sub-tree narrowing: a Primary Contact only sees their unit and everything
    # beneath it. Surface the scoped sub-tree roots (full sub-trees intact).
    if user.unit_scope is not None:
        scope_ids = {str(u) for u in user.unit_scope}

        def _collect_scoped(nodes: list[UnitScoreOut]) -> list[UnitScoreOut]:
            out: list[UnitScoreOut] = []
            for n in nodes:
                if n.unit_id in scope_ids:
                    out.append(n)
                else:
                    out.extend(_collect_scoped(n.children))
            return out

        unit_trees = _collect_scoped(unit_trees)

    # Organisation total is the consolidated average across the top-level units
    # (business units), keeping the whole report on one averaging model.
    if any(u.overall_score > 0 for u in unit_trees):
        overall, dim_scores = _avg_children(unit_trees)
    else:
        overall, dim_scores = _dim_outs(all_responses)

    return HierarchyScoreOut(
        org_name=org.name, org_industry=org.industry,
        overall_score=overall, maturity_label=maturity_label(overall),
        dimensions=dim_scores, units=unit_trees,
    )
