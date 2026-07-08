from __future__ import annotations

import os
from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user, CurrentUser
from app.core.permissions import can_see_org
from app.core.tenant import apply_rls
from app.db.session import get_db
from app.models.assessment import Assessment
from app.models.organization import Organization
from app.models.response import Response
from app.repositories.assessment import AssessmentRepository
from app.repositories.dimension import DimensionRepository
from app.repositories.response import ResponseRepository
from app.api.v1.responses import _build_score_from_responses

router = APIRouter()

_DIM_NARRATIVE = {
    "LEADERSHIP_VISION": "Strategic alignment, executive sponsorship, AI vision communication",
    "DATA_INFRASTRUCTURE": "Data quality, governance, integration pipelines, AI/ML readiness",
    "TECHNOLOGY_STACK": "ML/GenAI tooling, MLOps practices, model development infrastructure",
    "PEOPLE_CULTURE": "AI literacy, talent, cross-functional collaboration, learning culture",
    "GOVERNANCE_RISK": "Policies, ethics frameworks, compliance controls, accountability",
    "USE_CASE_CLARITY": "Use case identification, prioritisation, business value validation",
    "VALUE_ROI": "AI investment measurement, business case maturity, outcome realisation",
}

_MATURITY_GUIDANCE = {
    "Initial": "organisation is at the awareness stage with little or no AI implementation",
    "Developing": "organisation is running isolated pilots and proofs-of-concept",
    "Managed": "organisation is maturing processes and scaling successful experiments",
    "Advanced": "organisation is operationalising AI broadly across the business",
    "Optimized": "organisation is continuously improving and innovating with AI at enterprise scale",
}


class GenerateReportRequest(BaseModel):
    include_recommendations: bool = True
    # Optional consultant-supplied prompt/template. When provided it replaces the
    # default report structure instructions; the scores, comments and other data
    # context are always supplied to the model regardless.
    custom_prompt: str | None = None


class BenchmarkDimension(BaseModel):
    code: str
    name: str
    your_score: float
    industry_avg: float


class BenchmarkOrg(BaseModel):
    label: str          # anonymised ("Organization A") or "Your Organization"
    overall: float
    is_you: bool


class BenchmarkResponse(BaseModel):
    available: bool
    reason: str | None = None
    industry: str | None = None
    org_count: int = 0
    your_overall: float = 0.0
    industry_average: float = 0.0
    top_quartile: float = 0.0
    dimensions: list[BenchmarkDimension] = []
    organizations: list[BenchmarkOrg] = []


class GenerateReportResponse(BaseModel):
    narrative: str
    model_used: str


@router.post("/{assessment_id}/generate-report", response_model=GenerateReportResponse)
async def generate_ai_report(
    assessment_id: UUID,
    body: GenerateReportRequest = GenerateReportRequest(),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GenerateReportResponse:
    await apply_rls(db, user.tenant_id)

    repo = AssessmentRepository(db)
    assessment = await repo.get_with_relations(assessment_id, user.tenant_id)
    if not assessment or not can_see_org(user, assessment.org_id):
        raise HTTPException(status_code=404, detail="Assessment not found")

    dim_repo = DimensionRepository(db)
    resp_repo = ResponseRepository(db)

    all_responses = await resp_repo.get_for_assessment(assessment_id)
    dimensions = await dim_repo.list_all_with_questions()
    overall, dim_scores = _build_score_from_responses(all_responses, dimensions)

    from app.core.scoring import maturity_label
    overall_label = maturity_label(overall)

    dim_lines = "\n".join(
        f"  - {ds.dimension_name}: {ds.score:.2f}/5.0 ({ds.label}) — {_DIM_NARRATIVE.get(ds.dimension_code, '')}"
        for ds in sorted(dim_scores, key=lambda x: x.score, reverse=True)
    )

    prompt_parts = [
        f"You are a senior AI transformation consultant. Write a detailed, professional assessment report narrative for the following organisation.",
        f"",
        f"ORGANISATION: {assessment.organization_name}",
    ]
    if assessment.org_context:
        prompt_parts += ["", f"CONSULTANT CONTEXT:", assessment.org_context]
    if assessment.notes:
        prompt_parts += ["", f"CONSULTANT NOTES:", assessment.notes]

    prompt_parts += [
        "",
        f"OVERALL AI MATURITY SCORE: {overall:.2f}/5.0 — {overall_label}",
        f"({_MATURITY_GUIDANCE.get(overall_label, '')})",
        "",
        "DIMENSION SCORES:",
        dim_lines,
    ]

    if body.include_recommendations:
        worst = sorted(dim_scores, key=lambda x: x.score)[:3]
        best = sorted(dim_scores, key=lambda x: x.score, reverse=True)[:3]
        prompt_parts += [
            "",
            "TOP STRENGTHS (highest scoring): " + ", ".join(f"{d.dimension_name} ({d.score:.1f})" for d in best),
            "PRIORITY AREAS (lowest scoring): " + ", ".join(f"{d.dimension_name} ({d.score:.1f})" for d in worst),
        ]

    # Per-question detail: the individual scores and any consultant comments
    # (observations) captured while conducting the assessment. This grounds the
    # narrative in the actual evidence rather than dimension averages alone.
    q_meta: dict = {}
    for dim in dimensions:
        for q in dim.questions:
            q_meta[q.id] = (dim.name, q.text)

    detail_by_dim: dict[str, list[str]] = defaultdict(list)
    comment_lines: list[str] = []
    for r in all_responses:
        meta = q_meta.get(r.question_id)
        if not meta:
            continue
        dim_nm, q_text = meta
        line = f"    - [{r.score}/5] {q_text}"
        if r.observations:
            line += f"\n      Consultant comment: {r.observations}"
            comment_lines.append(f"  - ({dim_nm}) {q_text}: {r.observations}")
        detail_by_dim[dim_nm].append(line)

    if detail_by_dim:
        prompt_parts += ["", "DETAILED QUESTION RESPONSES (score out of 5, with consultant comments where given):"]
        for dim_nm in sorted(detail_by_dim.keys()):
            prompt_parts.append(f"  {dim_nm}:")
            prompt_parts.extend(detail_by_dim[dim_nm])

    if comment_lines:
        prompt_parts += ["", "CONSULTANT COMMENTS (verbatim — weave these observations into the analysis):"]
        prompt_parts.extend(comment_lines)

    if body.custom_prompt and body.custom_prompt.strip():
        # Consultant-driven format: their template/prompt controls the structure,
        # while all the data above is still available for the model to draw on.
        prompt_parts += [
            "",
            "REPORT INSTRUCTIONS (provided by the consultant — follow these exactly):",
            body.custom_prompt.strip(),
            "",
            "Ground the report in the scores, question responses and consultant comments above. Be specific to this organisation — no generic filler.",
        ]
    else:
        prompt_parts += [
            "",
            "Write a structured report with these sections:",
            "1. Executive Summary (2–3 paragraphs): overall maturity level, key strengths, strategic positioning",
            "2. Detailed Dimension Analysis: for each dimension, one paragraph with interpretation and context",
            "3. Key Strengths (bullet points)",
            "4. Priority Recommendations (numbered, actionable, specific)",
            "5. Closing Statement: forward-looking paragraph on the transformation journey",
            "",
            "Write in a professional, consulting tone. Be specific about this organisation — do not use generic filler text. Use the consultant context, notes, question responses and comments to add real insight.",
        ]

    prompt = "\n".join(prompt_parts)

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is not configured. Set it in the backend environment to enable AI report generation.",
        )

    try:
        import openai
        # Async client + await: a synchronous call here would block the event
        # loop for the whole (slow) completion, which makes the platform gateway
        # time out and return a hard 502.
        client = openai.AsyncOpenAI(api_key=api_key, timeout=120.0)
        response = await client.chat.completions.create(
            model="gpt-4o",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        narrative = response.choices[0].message.content or ""
        model_used = response.model
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="openai package is not installed. Run: pip install openai",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI generation failed: {type(e).__name__}: {e}")

    return GenerateReportResponse(narrative=narrative, model_used=model_used)


def _percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    if len(ordered) == 1:
        return round(ordered[0], 2)
    rank = pct * (len(ordered) - 1)
    lo = int(rank)
    hi = min(lo + 1, len(ordered) - 1)
    frac = rank - lo
    return round(ordered[lo] + (ordered[hi] - ordered[lo]) * frac, 2)


@router.get("/{assessment_id}/benchmark", response_model=BenchmarkResponse)
async def domain_benchmark(
    assessment_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BenchmarkResponse:
    """Anonymised industry (domain) benchmarking.

    Compares this assessment's organization against the average and top quartile
    of all organizations in the same industry, per dimension and overall. Other
    organizations are never named — they appear as 'Organization A/B/C…'.
    """
    await apply_rls(db, user.tenant_id)

    repo = AssessmentRepository(db)
    assessment = await repo.get_with_relations(assessment_id, user.tenant_id)
    if not assessment or not can_see_org(user, assessment.org_id):
        raise HTTPException(status_code=404, detail="Assessment not found")

    if not assessment.org_id:
        return BenchmarkResponse(available=False, reason="Assessment is not linked to an organization.")

    org = await db.get(Organization, assessment.org_id)
    if org is None or not org.industry:
        return BenchmarkResponse(available=False, reason="Organization has no industry set for benchmarking.")

    # Organizations in the same industry (tenant-scoped by RLS).
    peer_rows = (await db.execute(
        select(Organization.id).where(
            Organization.tenant_id == user.tenant_id,
            Organization.industry == org.industry,
        )
    )).scalars().all()
    peer_ids = set(peer_rows)

    # All responses across those organizations' assessments, tagged with org id.
    resp_rows = (await db.execute(
        select(Response, Assessment.org_id)
        .join(Assessment, Assessment.id == Response.assessment_id)
        .where(Assessment.org_id.in_(peer_ids))
        .options(selectinload(Response.question))
    )).all()

    by_org: dict = {}
    for resp, org_id in resp_rows:
        by_org.setdefault(org_id, []).append(resp)

    dim_repo = DimensionRepository(db)
    dimensions = await dim_repo.list_all_with_questions()

    # Per-org overall + per-dimension scores (only orgs with responses count).
    org_overall: dict = {}
    org_dim: dict = {}
    for org_id, responses in by_org.items():
        overall, dim_scores = _build_score_from_responses(responses, dimensions)
        if not dim_scores:
            continue
        org_overall[org_id] = round(overall, 2)
        org_dim[org_id] = {ds.dimension_code: ds.score for ds in dim_scores}

    if len(org_overall) < 2:
        return BenchmarkResponse(
            available=False, industry=org.industry, org_count=len(org_overall),
            reason="Not enough organizations with scores in this industry yet to benchmark.",
        )

    overalls = list(org_overall.values())
    industry_average = round(sum(overalls) / len(overalls), 2)
    top_quartile = _percentile(overalls, 0.75)
    your_overall = org_overall.get(assessment.org_id, 0.0)

    # Per-dimension: your score vs industry average across peers that have it.
    dim_out: list[BenchmarkDimension] = []
    your_dims = org_dim.get(assessment.org_id, {})
    for dim in dimensions:
        peer_scores = [d[dim.code] for d in org_dim.values() if dim.code in d]
        if not peer_scores:
            continue
        dim_out.append(BenchmarkDimension(
            code=dim.code, name=dim.name,
            your_score=round(your_dims.get(dim.code, 0.0), 2),
            industry_avg=round(sum(peer_scores) / len(peer_scores), 2),
        ))

    # Anonymised org list (highest first); the current org is flagged, others lettered.
    others = sorted(
        [(oid, ov) for oid, ov in org_overall.items() if oid != assessment.org_id],
        key=lambda x: x[1], reverse=True,
    )
    orgs_out: list[BenchmarkOrg] = [
        BenchmarkOrg(label="Your Organization", overall=your_overall, is_you=True)
    ]
    for i, (_oid, ov) in enumerate(others):
        orgs_out.append(BenchmarkOrg(label=f"Organization {chr(65 + i)}", overall=ov, is_you=False))

    return BenchmarkResponse(
        available=True, industry=org.industry, org_count=len(org_overall),
        your_overall=your_overall, industry_average=industry_average,
        top_quartile=top_quartile, dimensions=dim_out, organizations=orgs_out,
    )
