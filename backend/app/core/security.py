"""App-native auth helpers: password hashing, JWT issue/verify, username generation."""
from __future__ import annotations

import re
import secrets
import time
from uuid import UUID

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

_APP_ISSUER = "aima"


# ── Passwords ──────────────────────────────────────────────────────────────

def _pw_bytes(password: str) -> bytes:
    # bcrypt hard-limits input to 72 bytes; truncate deterministically.
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_pw_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_pw_bytes(password), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def default_password(username: str) -> str:
    """Spec default: <username>@123."""
    return f"{username}@123"


# ── App JWTs ─────────────────────────────────────────────────────────────────

def create_access_token(*, user_id: UUID, tenant_id: UUID, role: str) -> str:
    now = int(time.time())
    payload = {
        "iss": _APP_ISSUER,
        "sub": str(user_id),
        "tid": str(tenant_id),
        "role": role,
        "iat": now,
        "exp": now + settings.JWT_EXPIRE_MINUTES * 60,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Return the payload for a valid app-issued token, else None."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM],
            options={"verify_aud": False},
        )
    except JWTError:
        return None
    if payload.get("iss") != _APP_ISSUER:
        return None
    return payload


# ── Username generation ──────────────────────────────────────────────────────

_SUFFIXES = list("xyz@#$%") + [str(n) for n in range(10)]


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (value or "").strip().lower())


def generate_username(first_name: str, last_name: str, exists: "callable[[str], bool]") -> str:
    """firstname + progressive letters of lastname; then a suffix on exhaustion.

    `exists(candidate)` returns True if the username is already taken.
    Always yields a unique username.

    Examples: Ajay Sharma -> ajays; on collision -> ajayh, ajaya, ... then ajaysx.
    """
    first = _slug(first_name) or "user"
    last = _slug(last_name)

    # firstname + one letter of lastname, walking through the lastname letters.
    if last:
        for ch in last:
            candidate = f"{first}{ch}"
            if not exists(candidate):
                return candidate
    elif not exists(first):
        return first

    # Exhausted — append deterministic suffixes to the base, then random.
    base = f"{first}{last[:1]}" if last else first
    for s in _SUFFIXES:
        candidate = f"{base}{s}"
        if not exists(candidate):
            return candidate
    while True:
        candidate = f"{base}{secrets.token_hex(2)}"
        if not exists(candidate):
            return candidate
