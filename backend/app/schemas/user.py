from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, Field

from app.models.user import UserRole


class UserOut(BaseModel):
    id: UUID
    email: str
    name: str | None
    username: str | None
    role: UserRole
    is_active: bool
    primary_org_unit_id: UUID | None

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(default="", max_length=100)
    email: str
    role: UserRole
    primary_org_unit_id: UUID | None = None
    # Optional explicit password; defaults to <username>@123 when omitted.
    password: str | None = None


class UserCreateResult(UserOut):
    # Returned once on creation so the admin can share the initial credentials.
    generated_username: str
    initial_password: str


class UserUpdate(BaseModel):
    name: str | None = None
    role: UserRole | None = None
    is_active: bool | None = None
    primary_org_unit_id: UUID | None = None


class PasswordResetOut(BaseModel):
    username: str
    new_password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    name: str | None
    user_id: UUID


class MeOut(BaseModel):
    user_id: UUID
    email: str
    name: str | None
    role: UserRole
    org_scope: list[UUID] | None  # None = all organizations
