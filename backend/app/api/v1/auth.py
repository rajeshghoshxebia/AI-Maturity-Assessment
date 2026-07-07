from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import LoginRequest, MeOut, TokenResponse

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Credential login. Runs without a tenant context so the RLS carve-out on
    `users` (readable when no tenant GUC is set) permits the username lookup."""
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalars().first()
    if (
        user is None
        or not user.is_active
        or not user.password_hash
        or not verify_password(body.password, user.password_hash)
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    token = create_access_token(user_id=user.id, tenant_id=user.tenant_id, role=user.role.value)
    return TokenResponse(
        access_token=token, role=user.role, name=user.name, user_id=user.id,
    )


@router.get("/me", response_model=MeOut)
async def me(user: CurrentUser = Depends(get_current_user)) -> MeOut:
    return MeOut(
        user_id=user.user_id,
        email=user.email,
        name=None,
        role=user.role,  # type: ignore[arg-type]
        org_scope=None if user.org_scope is None else sorted(user.org_scope),
    )
