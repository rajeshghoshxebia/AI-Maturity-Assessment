import os
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings

# Vercel runs each request in an ephemeral function — connection pooling causes
# "connection already closed" errors. NullPool creates/closes a fresh connection
# per request, which is correct for serverless.
_serverless = bool(os.getenv("VERCEL"))

engine = create_async_engine(
    settings.DATABASE_URL,
    poolclass=NullPool if _serverless else None,
    pool_size=10 if not _serverless else None,
    max_overflow=20 if not _serverless else None,
    echo=not settings.is_production,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:  # type: ignore[return]
    async with AsyncSessionLocal() as session:
        yield session
