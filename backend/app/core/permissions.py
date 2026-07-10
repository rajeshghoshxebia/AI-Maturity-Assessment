"""Role checks and organization-scope resolution for RBAC."""
from __future__ import annotations

from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.models.consultant_assignment import ConsultantAssignment
from app.models.organization import OrgUnit
from app.models.user import UserRole

ADMIN = UserRole.ADMINISTRATOR.value
PC_ORG = UserRole.PC_ORGANIZATION.value
PC_BU = UserRole.PC_BUSINESS_UNIT.value
PC_TEAM = UserRole.PC_TEAM.value
CONSULTANT = UserRole.ASSESSMENT_CONSULTANT.value
MEMBER = UserRole.MEMBER.value
VIEWER = UserRole.VIEWER.value


async def resolve_org_scope(
    db: AsyncSession,
    *,
    user_id: UUID,
    role: str,
    primary_org_unit_id: UUID | None,
) -> set[UUID] | None:
    """Return the set of organization ids the user may see, or None for 'all'.

    - Administrator: None (unrestricted).
    - Assessment Consultant: organizations from active assignments.
    - Everyone else: the organization of their primary org unit (if any).
    """
    if role == ADMIN:
        return None
    if role == CONSULTANT:
        rows = await db.execute(
            select(ConsultantAssignment.organization_id).where(
                ConsultantAssignment.person_id == user_id,
                ConsultantAssignment.active.is_(True),
            )
        )
        return set(rows.scalars().all())
    if primary_org_unit_id:
        row = await db.execute(select(OrgUnit.org_id).where(OrgUnit.id == primary_org_unit_id))
        org_id = row.scalar_one_or_none()
        return {org_id} if org_id else set()
    return set()


def require_roles(*roles: str):
    """Dependency factory: 403 unless the current user holds one of `roles`."""
    allowed = set(roles)

    async def _guard(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return _guard


def can_edit_org(user: CurrentUser, org_id: UUID | None) -> bool:
    """Write access (hierarchical):
    - Administrator: everything.
    - Assessment Consultant: only their assigned organizations.
    - All other roles: no edit access.
    """
    if user.role == ADMIN:
        return True
    if user.role == CONSULTANT:
        return org_id is not None and user.org_scope is not None and org_id in user.org_scope
    return False


def can_view_org(user: CurrentUser, org_id: UUID | None) -> bool:
    """Read access, limited to the user's organization scope.
    - Administrator (scope None): everything.
    - Consultant: their assigned organizations.
    - Other roles: their own organization.
    """
    if user.role == ADMIN or user.org_scope is None:
        return True
    if org_id is None:
        return False
    return org_id in user.org_scope


# Backwards-compatible alias (edit semantics).
def can_see_org(user: CurrentUser, org_id: UUID | None) -> bool:
    return can_edit_org(user, org_id)
