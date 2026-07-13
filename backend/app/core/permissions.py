"""Role checks and organization-scope resolution for RBAC."""
from __future__ import annotations

from collections import defaultdict
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.models.consultant_assignment import ConsultantAssignment
from app.models.organization import Organization, OrgUnit
from app.models.user import UserRole

ADMIN = UserRole.ADMINISTRATOR.value
PC_ORG = UserRole.PC_ORGANIZATION.value
PC_BU = UserRole.PC_BUSINESS_UNIT.value
PC_TEAM = UserRole.PC_TEAM.value
CONSULTANT = UserRole.ASSESSMENT_CONSULTANT.value
MEMBER = UserRole.MEMBER.value
VIEWER = UserRole.VIEWER.value


async def _subtree_unit_ids(db: AsyncSession, org_id: UUID, root_unit_id: UUID) -> set[UUID]:
    """All org-unit ids in the subtree rooted at root_unit_id (inclusive)."""
    rows = (await db.execute(
        select(OrgUnit.id, OrgUnit.parent_id).where(OrgUnit.org_id == org_id)
    )).all()
    children: dict = defaultdict(list)
    for uid, pid in rows:
        children[pid].append(uid)
    subtree: set[UUID] = set()
    stack = [root_unit_id]
    while stack:
        node = stack.pop()
        subtree.add(node)
        stack.extend(children.get(node, []))
    return subtree


async def resolve_scopes(
    db: AsyncSession,
    *,
    user_id: UUID,
    role: str,
    primary_org_unit_id: UUID | None,
) -> tuple[set[UUID] | None, set[UUID] | None]:
    """Return (org_scope, unit_scope).

    org_scope: organization ids the user may see (None = all).
    unit_scope: org-unit ids the user may see in hierarchy reports (None = all
    units within org_scope). Used to narrow reports to a PC's sub-tree.
    """
    if role == ADMIN:
        return None, None
    if role == CONSULTANT:
        rows = await db.execute(
            select(ConsultantAssignment.organization_id).where(
                ConsultantAssignment.person_id == user_id,
                ConsultantAssignment.active.is_(True),
            )
        )
        return set(rows.scalars().all()), None
    if role == PC_ORG:
        # Organization(s) where this user is the org-level primary contact.
        rows = await db.execute(
            select(Organization.id).where(Organization.primary_contact_id == user_id)
        )
        return set(rows.scalars().all()), None
    if role in (PC_BU, PC_TEAM) and primary_org_unit_id:
        unit = await db.get(OrgUnit, primary_org_unit_id)
        if unit is None:
            return set(), set()
        subtree = await _subtree_unit_ids(db, unit.org_id, unit.id)
        return {unit.org_id}, subtree
    # Members / Viewers: their organization (org-level, no sub-tree narrowing).
    if primary_org_unit_id:
        row = await db.execute(select(OrgUnit.org_id).where(OrgUnit.id == primary_org_unit_id))
        org_id = row.scalar_one_or_none()
        return ({org_id} if org_id else set()), None
    return set(), None


# Back-compat wrapper (org scope only).
async def resolve_org_scope(db: AsyncSession, *, user_id: UUID, role: str, primary_org_unit_id: UUID | None) -> set[UUID] | None:
    org_scope, _ = await resolve_scopes(db, user_id=user_id, role=role, primary_org_unit_id=primary_org_unit_id)
    return org_scope


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


def can_view_unit(user: CurrentUser, unit_id: UUID) -> bool:
    """Whether a hierarchy unit is within the user's sub-tree scope
    (None unit_scope = all units in view)."""
    scope = getattr(user, "unit_scope", None)
    if scope is None:
        return True
    return unit_id in scope
