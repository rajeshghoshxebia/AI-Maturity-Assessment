from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.core.permissions import ADMIN, PC_ORG, require_roles
from app.core.tenant import apply_rls
from app.db.session import get_db
from app.models.consultant_assignment import ConsultantAssignment
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.schemas.consultant_assignment import (
    ConsultantAssignmentCreate,
    ConsultantAssignmentOut,
    ConsultantAssignmentUpdate,
)

router = APIRouter()

_admin = require_roles(ADMIN, PC_ORG)


def _to_out(a: ConsultantAssignment, person: User | None, org: Organization | None) -> ConsultantAssignmentOut:
    return ConsultantAssignmentOut(
        id=a.id, person_id=a.person_id, organization_id=a.organization_id,
        active=a.active, assigned_date=a.created_at,
        consultant_name=person.name if person else None,
        consultant_username=person.username if person else None,
        consultant_email=person.email if person else None,
        organization_name=org.name if org else None,
    )


@router.get("", response_model=list[ConsultantAssignmentOut])
async def list_assignments(
    user: CurrentUser = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> list[ConsultantAssignmentOut]:
    await apply_rls(db, user.tenant_id)
    rows = (await db.execute(
        select(ConsultantAssignment, User, Organization)
        .join(User, User.id == ConsultantAssignment.person_id)
        .join(Organization, Organization.id == ConsultantAssignment.organization_id)
        .order_by(ConsultantAssignment.created_at.desc())
    )).all()
    return [_to_out(a, person, org) for a, person, org in rows]


@router.post("", response_model=ConsultantAssignmentOut, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    body: ConsultantAssignmentCreate,
    user: CurrentUser = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> ConsultantAssignmentOut:
    await apply_rls(db, user.tenant_id)

    person = await db.get(User, body.person_id)
    if person is None or person.role != UserRole.ASSESSMENT_CONSULTANT:
        raise HTTPException(status_code=400, detail="Person must be an Assessment Consultant")
    org = await db.get(Organization, body.organization_id)
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    existing = (await db.execute(
        select(ConsultantAssignment).where(
            ConsultantAssignment.person_id == body.person_id,
            ConsultantAssignment.organization_id == body.organization_id,
        )
    )).scalars().first()
    if existing is not None:
        raise HTTPException(status_code=409, detail="Consultant is already assigned to this organization")

    assignment = ConsultantAssignment(
        tenant_id=user.tenant_id, person_id=body.person_id,
        organization_id=body.organization_id, active=True, assigned_by=user.user_id,
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return _to_out(assignment, person, org)


@router.patch("/{assignment_id}", response_model=ConsultantAssignmentOut)
async def update_assignment(
    assignment_id: UUID,
    body: ConsultantAssignmentUpdate,
    user: CurrentUser = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> ConsultantAssignmentOut:
    await apply_rls(db, user.tenant_id)
    a = await db.get(ConsultantAssignment, assignment_id)
    if a is None or a.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Assignment not found")
    a.active = body.active
    await db.commit()
    await db.refresh(a)
    person = await db.get(User, a.person_id)
    org = await db.get(Organization, a.organization_id)
    return _to_out(a, person, org)


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: UUID,
    user: CurrentUser = Depends(_admin),
    db: AsyncSession = Depends(get_db),
):
    await apply_rls(db, user.tenant_id)
    a = await db.get(ConsultantAssignment, assignment_id)
    if a is None or a.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await db.delete(a)
    await db.commit()
