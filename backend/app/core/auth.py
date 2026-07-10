from __future__ import annotations

import time
import uuid
from typing import Any
from uuid import UUID

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decode_access_token
from app.core.tenant import apply_rls
from app.db.session import get_db

_bearer = HTTPBearer(auto_error=False)
_jwks_cache: dict[str, Any] = {}
_jwks_fetched_at: float = 0
_JWKS_TTL = 3600

# Fixed dev tenant/user IDs so RLS works consistently across requests
_DEV_TENANT_ID = UUID("00000000-0000-0000-0000-000000000001")
_DEV_USER_ID = UUID("00000000-0000-0000-0000-000000000002")


async def _get_jwks() -> dict[str, Any]:
    global _jwks_cache, _jwks_fetched_at
    if time.time() - _jwks_fetched_at < _JWKS_TTL and _jwks_cache:
        return _jwks_cache
    uri = settings.AZURE_JWKS_URI.format(tenant_id=settings.AZURE_TENANT_ID)
    async with httpx.AsyncClient() as client:
        resp = await client.get(uri, timeout=10)
        resp.raise_for_status()
    _jwks_cache = resp.json()
    _jwks_fetched_at = time.time()
    return _jwks_cache


async def _decode_token(token: str) -> dict[str, Any]:
    jwks = await _get_jwks()
    headers = jwt.get_unverified_header(token)
    kid = headers.get("kid")
    key_data = next((k for k in jwks["keys"] if k["kid"] == kid), None)
    if not key_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown signing key")
    public_key = jwk.construct(key_data)
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience=settings.AZURE_CLIENT_ID,
        )
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return payload


class CurrentUser:
    def __init__(
        self,
        user_id: UUID,
        oid: str,
        email: str,
        tenant_id: UUID,
        role: str,
        org_scope: set[UUID] | None = None,
    ) -> None:
        self.user_id = user_id
        self.oid = oid
        self.email = email
        self.tenant_id = tenant_id
        self.role = role
        # Set of organization ids the user may see; None = unrestricted (admin).
        self.org_scope = org_scope


def _dev_user() -> CurrentUser:
    # Dev bypass acts as a full Administrator so local work is unhindered.
    return CurrentUser(
        user_id=_DEV_USER_ID,
        oid="dev-oid",
        email="dev@xebia.com",
        tenant_id=_DEV_TENANT_ID,
        role="ADMINISTRATOR",
        org_scope=None,
    )


async def _load_and_scope(db: AsyncSession, user) -> CurrentUser:
    """Build a CurrentUser from a DB user row, resolving its org scope."""
    from app.core.permissions import resolve_org_scope

    await apply_rls(db, user.tenant_id)
    scope = await resolve_org_scope(
        db, user_id=user.id, role=user.role.value,
        primary_org_unit_id=user.primary_org_unit_id,
    )
    return CurrentUser(
        user_id=user.id, oid=user.azure_oid or "", email=user.email,
        tenant_id=user.tenant_id, role=user.role.value, org_scope=scope,
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> CurrentUser:
    from app.models.user import User

    # ── Path 1: app-issued JWT (credential login) ──────────────────────────
    # Honoured FIRST so a real credential login (e.g. a Consultant) is never
    # overridden by the dev bypass, even when Azure AD is not configured.
    if credentials is not None:
        app_payload = decode_access_token(credentials.credentials)
        if app_payload is not None:
            try:
                user_id = UUID(app_payload["sub"])
            except (KeyError, ValueError) as exc:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
            user = await db.get(User, user_id)
            if user is None or not user.is_active:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account inactive or not found")
            return await _load_and_scope(db, user)

    # ── Dev short-circuit: no credential session and no Azure AD configured ─
    is_dev = settings.APP_ENV == "development" and not settings.AZURE_TENANT_ID
    if is_dev:
        return _dev_user()

    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token = credentials.credentials

    # ── Path 2: Azure AD token → look up the real DB user ──────────────────
    payload = await _decode_token(token)
    oid = payload.get("oid") or payload.get("sub", "")
    email = payload.get("preferred_username") or payload.get("email", "")
    tenant_id_str = payload.get("tid", "")
    try:
        tenant_id = UUID(tenant_id_str)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid tenant") from exc

    await apply_rls(db, tenant_id)
    result = await db.execute(
        select(User).where(or_(User.azure_oid == oid, User.email == email))
    )
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No matching user account")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account inactive")
    return await _load_and_scope(db, user)
