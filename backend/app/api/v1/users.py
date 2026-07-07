from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.core.permissions import ADMIN, PC_ORG, require_roles
from app.core.security import default_password, generate_username, hash_password
from app.core.tenant import apply_rls
from app.db.session import get_db
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import PasswordResetOut, UserCreate, UserCreateResult, UserOut, UserUpdate

router = APIRouter()

# User administration is limited to Administrators and Organization Primary Contacts.
_admin = require_roles(ADMIN, PC_ORG)


@router.get("", response_model=list[UserOut])
async def list_users(
    user: CurrentUser = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> list[UserOut]:
    await apply_rls(db, user.tenant_id)
    result = await db.execute(select(User).order_by(User.email))
    return [UserOut.model_validate(u) for u in result.scalars().all()]


@router.post("", response_model=UserCreateResult, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    user: CurrentUser = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> UserCreateResult:
    await apply_rls(db, user.tenant_id)
    repo = UserRepository(db)

    first_slug = "".join(c for c in body.first_name.lower() if c.isalnum()) or "user"
    taken = await repo.taken_usernames(first_slug)
    username = generate_username(body.first_name, body.last_name, exists=lambda c: c in taken)

    initial_password = body.password or default_password(username)
    full_name = f"{body.first_name} {body.last_name}".strip()

    new_user = User(
        tenant_id=user.tenant_id,
        email=body.email,
        name=full_name,
        role=body.role,
        username=username,
        password_hash=hash_password(initial_password),
        is_active=True,
        primary_org_unit_id=body.primary_org_unit_id,
    )
    created = await repo.add(new_user)
    await db.commit()

    out = UserOut.model_validate(created).model_dump()
    return UserCreateResult(**out, generated_username=username, initial_password=initial_password)


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: UUID,
    body: UserUpdate,
    user: CurrentUser = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    await apply_rls(db, user.tenant_id)
    target = await db.get(User, user_id)
    if target is None or target.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(target, field, value)
    await db.commit()
    await db.refresh(target)
    return UserOut.model_validate(target)


@router.post("/{user_id}/reset-password", response_model=PasswordResetOut)
async def reset_password(
    user_id: UUID,
    user: CurrentUser = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> PasswordResetOut:
    await apply_rls(db, user.tenant_id)
    target = await db.get(User, user_id)
    if target is None or target.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="User not found")
    if not target.username:
        raise HTTPException(status_code=400, detail="User has no username / credential login")
    new_password = default_password(target.username)
    target.password_hash = hash_password(new_password)
    await db.commit()
    return PasswordResetOut(username=target.username, new_password=new_password)
