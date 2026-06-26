from __future__ import annotations

import uuid
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response as FastAPIResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, CurrentUser
from app.core.email import send_survey_invitation
from app.core.tenant import apply_rls
from app.db.session import get_db
from app.models.assessment import Assessment, AssessmentMode
from app.models.survey import SurveyInvitation

router = APIRouter()


class InviteeIn(BaseModel):
    email: EmailStr
    name: str | None = None


class InviteBatchIn(BaseModel):
    invitees: list[InviteeIn]


class InvitationOut(BaseModel):
    id: UUID
    email: str
    name: str | None
    status: str
    sent_at: datetime | None
    completed_at: datetime | None
    created_at: datetime
    survey_url: str | None = None

    model_config = {"from_attributes": True}


def _survey_url(request: Request, token: UUID) -> str:
    base = str(request.base_url).rstrip("/")
    # For the frontend app (port 3000) not the API (port 8000)
    # Try to infer from origin header or use env var fallback
    frontend_base = base.replace(":8000", ":3000")
    return f"{frontend_base}/survey/{token}"


async def _get_assessment(
    assessment_id: UUID,
    user: CurrentUser,
    db: AsyncSession,
) -> Assessment:
    await apply_rls(db, user.tenant_id)
    result = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail="Assessment not found")
    if obj.mode != AssessmentMode.SURVEY:
        raise HTTPException(status_code=400, detail="Invitations are only available for SURVEY mode assessments")
    return obj


@router.get("", response_model=list[InvitationOut])
async def list_invitations(
    assessment_id: UUID,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[InvitationOut]:
    await _get_assessment(assessment_id, user, db)
    result = await db.execute(
        select(SurveyInvitation)
        .where(SurveyInvitation.assessment_id == assessment_id)
        .order_by(SurveyInvitation.created_at)
    )
    invites = result.scalars().all()
    return [
        InvitationOut(
            id=inv.id,
            email=inv.email,
            name=inv.name,
            status=inv.status,
            sent_at=inv.sent_at,
            completed_at=inv.completed_at,
            created_at=inv.created_at,
            survey_url=_survey_url(request, inv.token),
        )
        for inv in invites
    ]


@router.post("", response_model=list[InvitationOut])
async def send_invitations(
    assessment_id: UUID,
    body: InviteBatchIn,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[InvitationOut]:
    assessment = await _get_assessment(assessment_id, user, db)

    results = []
    for invitee in body.invitees:
        # Upsert — don't create duplicate for same email
        existing = await db.execute(
            select(SurveyInvitation).where(
                SurveyInvitation.assessment_id == assessment_id,
                SurveyInvitation.email == invitee.email,
                SurveyInvitation.status != "REVOKED",
            )
        )
        inv = existing.scalar_one_or_none()

        if not inv:
            inv = SurveyInvitation(
                id=uuid.uuid4(),
                assessment_id=assessment_id,
                email=invitee.email,
                name=invitee.name,
                token=uuid.uuid4(),
                status="PENDING",
            )
            db.add(inv)
            await db.flush()

        survey_url = _survey_url(request, inv.token)
        sent = await send_survey_invitation(
            to_email=inv.email,
            to_name=inv.name,
            org_name=assessment.organization_name,
            survey_url=survey_url,
        )
        if sent:
            inv.sent_at = datetime.now(timezone.utc)
            inv.status = "PENDING"

        results.append(InvitationOut(
            id=inv.id,
            email=inv.email,
            name=inv.name,
            status=inv.status,
            sent_at=inv.sent_at,
            completed_at=inv.completed_at,
            created_at=inv.created_at,
            survey_url=survey_url,
        ))

    await db.commit()
    return results


@router.delete("/{invitation_id}", status_code=204, response_class=FastAPIResponse)
async def revoke_invitation(
    assessment_id: UUID,
    invitation_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FastAPIResponse:
    await _get_assessment(assessment_id, user, db)
    result = await db.execute(
        select(SurveyInvitation).where(
            SurveyInvitation.id == invitation_id,
            SurveyInvitation.assessment_id == assessment_id,
        )
    )
    inv = result.scalar_one_or_none()
    if inv:
        inv.status = "REVOKED"
        await db.commit()
    return FastAPIResponse(status_code=204)
