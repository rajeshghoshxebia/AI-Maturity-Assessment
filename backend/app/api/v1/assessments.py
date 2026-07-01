from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, CurrentUser
from app.core.tenant import apply_rls
from app.db.session import get_db
from app.models.assessment import Assessment, AssessmentStatus
from app.repositories.assessment import AssessmentRepository
from app.repositories.dimension import DimensionRepository
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentOut,
    AssessmentListOut,
    AssessmentUpdate,
    SubcategoryRefOut,
)

router = APIRouter()


def _to_out(assessment: Assessment) -> AssessmentOut:
    """Convert ORM Assessment (with loaded active_subcategories) to schema."""
    subs = [
        SubcategoryRefOut(
            id=asc.subcategory.id,
            code=asc.subcategory.code,
            name=asc.subcategory.name,
        )
        for asc in (assessment.active_subcategories or [])
        if asc.subcategory is not None
    ]
    return AssessmentOut(
        id=assessment.id,
        tenant_id=assessment.tenant_id,
        organization_name=assessment.organization_name,
        mode=assessment.mode,
        status=assessment.status,
        notes=assessment.notes,
        created_at=assessment.created_at,
        completed_at=assessment.completed_at,
        active_subcategories=subs,
        org_id=assessment.org_id,
        org_unit_id=assessment.org_unit_id,
    )


async def _get_repo(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> tuple[AssessmentRepository, CurrentUser]:
    await apply_rls(db, user.tenant_id)
    return AssessmentRepository(db), user


@router.get("", response_model=list[AssessmentListOut])
async def list_assessments(
    deps: tuple = Depends(_get_repo),
) -> list[AssessmentListOut]:
    repo, user = deps
    items = await repo.list_for_tenant(user.tenant_id)
    return [AssessmentListOut.model_validate(a) for a in items]


@router.post("", response_model=AssessmentOut, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    body: AssessmentCreate,
    deps: tuple = Depends(_get_repo),
    db: AsyncSession = Depends(get_db),
) -> AssessmentOut:
    repo, user = deps

    assessment = Assessment(
        tenant_id=user.tenant_id,
        created_by=user.user_id,
        organization_name=body.organization_name,
        mode=body.mode,
        status=AssessmentStatus.DRAFT,
        notes=body.notes,
        org_id=body.org_id,
        org_unit_id=body.org_unit_id,
    )
    await repo.add(assessment)
    await db.flush()

    if body.active_subcategory_codes:
        dim_repo = DimensionRepository(db)
        sub_ids = []
        for code in body.active_subcategory_codes:
            sub = await dim_repo.get_subcategory_by_code(code)
            if sub:
                sub_ids.append(sub.id)
        await repo.set_subcategories(assessment.id, sub_ids)

    await db.commit()
    full = await repo.get_with_relations(assessment.id, user.tenant_id)
    return _to_out(full)


@router.get("/{assessment_id}", response_model=AssessmentOut)
async def get_assessment(
    assessment_id: UUID,
    deps: tuple = Depends(_get_repo),
) -> AssessmentOut:
    repo, user = deps
    obj = await repo.get_with_relations(assessment_id, user.tenant_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return _to_out(obj)


@router.patch("/{assessment_id}", response_model=AssessmentOut)
async def update_assessment(
    assessment_id: UUID,
    body: AssessmentUpdate,
    deps: tuple = Depends(_get_repo),
    db: AsyncSession = Depends(get_db),
) -> AssessmentOut:
    repo, user = deps
    obj = await repo.get_with_relations(assessment_id, user.tenant_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Assessment not found")

    for field, value in body.model_dump(exclude_unset=True, exclude={"active_subcategory_codes"}).items():
        setattr(obj, field, value)

    if body.active_subcategory_codes is not None:
        dim_repo = DimensionRepository(db)
        sub_ids = []
        for code in body.active_subcategory_codes:
            sub = await dim_repo.get_subcategory_by_code(code)
            if sub:
                sub_ids.append(sub.id)
        await repo.set_subcategories(obj.id, sub_ids)

    await db.commit()
    full = await repo.get_with_relations(obj.id, user.tenant_id)
    return _to_out(full)


@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(
    assessment_id: UUID,
    deps: tuple = Depends(_get_repo),
    db: AsyncSession = Depends(get_db),
) -> None:
    repo, user = deps
    obj = await repo.get(assessment_id)
    if not obj or obj.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Assessment not found")
    await repo.delete(obj)
    await db.commit()
