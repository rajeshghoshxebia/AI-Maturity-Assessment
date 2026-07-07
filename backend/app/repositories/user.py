from __future__ import annotations

from sqlalchemy import select

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    async def taken_usernames(self, prefix: str) -> set[str]:
        """All existing usernames beginning with `prefix` (for uniqueness checks)."""
        result = await self.session.execute(
            select(User.username).where(User.username.like(f"{prefix}%"))
        )
        return {u for u in result.scalars().all() if u}

    async def get_by_username(self, username: str) -> User | None:
        result = await self.session.execute(select(User).where(User.username == username))
        return result.scalars().first()
