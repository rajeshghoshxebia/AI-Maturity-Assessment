from __future__ import annotations

import time
import uuid
from typing import Any
from uuid import UUID

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt

from app.core.config import settings

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
    ) -> None:
        self.user_id = user_id
        self.oid = oid
        self.email = email
        self.tenant_id = tenant_id
        self.role = role


def _dev_user() -> CurrentUser:
    return CurrentUser(
        user_id=_DEV_USER_ID,
        oid="dev-oid",
        email="dev@xebia.com",
        tenant_id=_DEV_TENANT_ID,
        role="CONSULTANT",
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> CurrentUser:
    # ── Dev short-circuit: no Azure AD configured ──────────────────────────
    is_dev = settings.APP_ENV == "development" and not settings.AZURE_TENANT_ID
    if is_dev:
        return _dev_user()

    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = await _decode_token(credentials.credentials)
    oid = payload.get("oid") or payload.get("sub", "")
    email = payload.get("preferred_username") or payload.get("email", "")
    tenant_id_str = payload.get("tid", "")
    role = payload.get("extension_role", "CONSULTANT")
    try:
        tenant_id = UUID(tenant_id_str)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid tenant") from exc

    return CurrentUser(
        user_id=uuid.uuid4(),  # will be looked up from DB in production
        oid=oid,
        email=email,
        tenant_id=tenant_id,
        role=role,
    )
