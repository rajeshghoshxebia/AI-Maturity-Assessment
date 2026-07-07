from __future__ import annotations

import os
from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, CurrentUser
from app.core.permissions import can_see_org
from app.core.tenant import apply_rls
from app.db.session import get_db
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
    "Planning": "organisation is at the awareness/planning stage with limited AI implementation",
    "Experimenting": "organisation is running isolated pilots and proofs-of-concept",
    "Standardizing": "organisation is maturing processes and scaling successful experiments",
    "Scaling": "organisation is operationalising AI broadly across the business",
    "Optimizing": "organisation is continuously improving and innovating with AI at enterprise scale",
}


class GenerateReportRequest(BaseModel):
    include_recommendations: bool = True
    # Optional consultant-supplied prompt/template. When provided it replaces the
    # default report structure instructions; the scores, comments and other data
    # context are always supplied to the model regardless.
    custom_prompt: str | None = None


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
