from __future__ import annotations

from contextvars import ContextVar
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

_tenant_id_var: ContextVar[UUID | None] = ContextVar("tenant_id", default=None)


def set_tenant(tenant_id: UUID) -> None:
    _tenant_id_var.set(tenant_id)


def get_tenant() -> UUID:
    tid = _tenant_id_var.get()
    if tid is None:
        raise RuntimeError("Tenant context not set")
    return tid


async def apply_rls(session: AsyncSession, tenant_id: UUID) -> None:
    """Set the Postgres session-level variable used by RLS policies.
    SET LOCAL does not support bind parameters, so the UUID is inlined safely.
    """
    await session.execute(
        text(f"SET LOCAL app.current_tenant_id = '{tenant_id}'")
    )
