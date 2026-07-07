from __future__ import annotations

import uuid
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user, CurrentUser
from app.core.permissions import can_see_org
from app.core.tenant import apply_rls
from app.db.session import get_db
from app.models.organization import Organization, OrgUnit
from app.schemas.organization import (
    OrganizationCreate, OrganizationUpdate, OrganizationOut, OrganizationListOut,
    OrgUnitCreate, OrgUnitUpdate, OrgUnitOut,
)

router = APIRouter()


def _build_tree(units: list[OrgUnit]) -> list[OrgUnitOut]:
    """Convert flat list of OrgUnits into a nested tree."""
    by_id: dict[UUID, OrgUnitOut] = {}
    for u in sorted(units, key=lambda x: x.sort_order):
        by_id[u.id] = OrgUnitOut(
            id=u.id,
            org_id=u.org_id,
            parent_id=u.parent_id,
            name=u.name,
            unit_type=u.unit_type,
            sort_order=u.sort_order,
            competency_codes=u.competency_codes or [],
            active_dimension_codes=u.active_dimension_codes,
            children=[],
        )
    roots: list[OrgUnitOut] = []
    for unit_out in by_id.values():
        if unit_out.parent_id and unit_out.parent_id in by_id:
            by_id[unit_out.parent_id].children.append(unit_out)
        else:
            roots.append(unit_out)
    return roots


async def _get_org(org_id: UUID, user: CurrentUser, db: AsyncSession) -> Organization:
    await apply_rls(db, user.tenant_id)
    if not can_see_org(user, org_id):
        raise HTTPException(status_code=404, detail="Organization not found")
    result = await db.execute(
        select(Organization)
        .where(Organization.id == org_id, Organization.tenant_id == user.tenant_id)
        .options(selectinload(Organization.units))
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


# ── Organizations ────────────────────────────────────────────────────────────

@router.get("", response_model=list[OrganizationListOut])
async def list_organizations(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[OrganizationListOut]:
    await apply_rls(db, user.tenant_id)
    # Empty scope → no visible organizations; None scope → unrestricted (admin).
    if user.org_scope is not None and not user.org_scope:
        return []
    stmt = (
        select(Organization, func.count(OrgUnit.id).label("unit_count"))
        .outerjoin(OrgUnit, OrgUnit.org_id == Organization.id)
        .where(Organization.tenant_id == user.tenant_id)
        .group_by(Organization.id)
        .order_by(Organization.name)
    )
    if user.org_scope is not None:
        stmt = stmt.where(Organization.id.in_(user.org_scope))
    result = await db.execute(stmt)
    rows = result.all()
    return [
        OrganizationListOut(
            id=org.id,
            name=org.name,
            industry=org.industry,
            created_at=org.created_at,
            unit_count=count,
        )
        for org, count in rows
    ]


@router.post("", response_model=OrganizationOut, status_code=201)
async def create_organization(
    body: OrganizationCreate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrganizationOut:
    await apply_rls(db, user.tenant_id)
    org = Organization(
        id=uuid.uuid4(),
        tenant_id=user.tenant_id,
        name=body.name,
        industry=body.industry,
    )
    db.add(org)
    await db.commit()
    await db.refresh(org)
    return OrganizationOut(
        id=org.id, tenant_id=org.tenant_id, name=org.name,
        industry=org.industry, created_at=org.created_at, updated_at=org.updated_at,
        units=[],
    )


@router.get("/{org_id}", response_model=OrganizationOut)
async def get_organization(
    org_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrganizationOut:
    org = await _get_org(org_id, user, db)
    return OrganizationOut(
        id=org.id, tenant_id=org.tenant_id, name=org.name,
        industry=org.industry, created_at=org.created_at, updated_at=org.updated_at,
        units=_build_tree(org.units),
    )


@router.patch("/{org_id}", response_model=OrganizationOut)
async def update_organization(
    org_id: UUID,
    body: OrganizationUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrganizationOut:
    org = await _get_org(org_id, user, db)
    if body.name is not None:
        org.name = body.name
    if body.industry is not None:
        org.industry = body.industry
    await db.commit()
    await db.refresh(org)
    return OrganizationOut(
        id=org.id, tenant_id=org.tenant_id, name=org.name,
        industry=org.industry, created_at=org.created_at, updated_at=org.updated_at,
        units=_build_tree(org.units),
    )


@router.delete("/{org_id}", status_code=204, response_class=Response)
async def delete_organization(
    org_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    org = await _get_org(org_id, user, db)
    await db.delete(org)
    await db.commit()
    return Response(status_code=204)


# ── Org Units ────────────────────────────────────────────────────────────────

@router.post("/{org_id}/units", response_model=OrgUnitOut, status_code=201)
async def create_unit(
    org_id: UUID,
    body: OrgUnitCreate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrgUnitOut:
    org = await _get_org(org_id, user, db)
    unit = OrgUnit(
        id=uuid.uuid4(),
        org_id=org.id,
        parent_id=body.parent_id,
        name=body.name,
        unit_type=body.unit_type,
        sort_order=body.sort_order,
        competency_codes=body.competency_codes,
        active_dimension_codes=body.active_dimension_codes,
    )
    db.add(unit)
    await db.commit()
    await db.refresh(unit)
    return OrgUnitOut(
        id=unit.id, org_id=unit.org_id, parent_id=unit.parent_id,
        name=unit.name, unit_type=unit.unit_type,
        sort_order=unit.sort_order, competency_codes=unit.competency_codes,
        active_dimension_codes=unit.active_dimension_codes, children=[],
    )


@router.patch("/{org_id}/units/{unit_id}", response_model=OrgUnitOut)
async def update_unit(
    org_id: UUID,
    unit_id: UUID,
    body: OrgUnitUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrgUnitOut:
    await _get_org(org_id, user, db)
    result = await db.execute(select(OrgUnit).where(OrgUnit.id == unit_id, OrgUnit.org_id == org_id))
    unit = result.scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    if body.name is not None:
        unit.name = body.name
    if body.unit_type is not None:
        unit.unit_type = body.unit_type
    if body.parent_id is not None:
        unit.parent_id = body.parent_id
    if body.sort_order is not None:
        unit.sort_order = body.sort_order
    if body.competency_codes is not None:
        unit.competency_codes = body.competency_codes
    if "active_dimension_codes" in body.model_fields_set:
        unit.active_dimension_codes = body.active_dimension_codes
    await db.commit()
    await db.refresh(unit)
    return OrgUnitOut(
        id=unit.id, org_id=unit.org_id, parent_id=unit.parent_id,
        name=unit.name, unit_type=unit.unit_type,
        sort_order=unit.sort_order, competency_codes=unit.competency_codes,
        active_dimension_codes=unit.active_dimension_codes, children=[],
    )


@router.delete("/{org_id}/units/{unit_id}", status_code=204, response_class=Response)
async def delete_unit(
    org_id: UUID,
    unit_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await _get_org(org_id, user, db)
    result = await db.execute(select(OrgUnit).where(OrgUnit.id == unit_id, OrgUnit.org_id == org_id))
    unit = result.scalar_one_or_none()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    await db.delete(unit)
    await db.commit()
    return Response(status_code=204)
