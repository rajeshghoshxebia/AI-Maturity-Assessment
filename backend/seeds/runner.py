"""
Seed the database with dimensions, sub-categories, questions, and competency levels.
Run once after migrations: python -m seeds.runner
"""
import asyncio
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select

from app.db.session import get_db
from app.models.dimension import Dimension, TechSubcategory
from app.models.question import Question, CompetencyLevel
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from seeds.dimensions import DIMENSIONS, TECH_SUBCATEGORIES
from seeds.questions import QUESTIONS

_DEV_TENANT_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
_DEV_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")


async def _seed_dev_tenant(session: AsyncSession) -> None:
    existing = await session.get(Tenant, _DEV_TENANT_ID)
    if not existing:
        session.add(Tenant(id=_DEV_TENANT_ID, name="Xebia Dev", slug="xebia-dev"))
        await session.flush()

    existing_user = await session.get(User, _DEV_USER_ID)
    if not existing_user:
        session.add(User(
            id=_DEV_USER_ID,
            tenant_id=_DEV_TENANT_ID,
            email="dev@xebia.com",
            name="Dev User",
            role=UserRole.CONSULTANT,
        ))
        await session.flush()


async def seed(session: AsyncSession) -> None:
    await _seed_dev_tenant(session)
    # ── dimensions ──────────────────────────────────────────────────────────
    dim_map: dict[str, uuid.UUID] = {}
    for d in DIMENSIONS:
        obj = Dimension(
            id=uuid.uuid4(),
            code=d["code"],
            name=d["name"],
            tag=d.get("tag"),
            description=d.get("description"),
            what_is_assessed=d.get("what_is_assessed"),
            order=d["order"],
            is_optional=d.get("is_optional", False),
        )
        session.add(obj)
        dim_map[d["code"]] = obj.id

    await session.flush()

    # ── tech sub-categories ─────────────────────────────────────────────────
    sub_map: dict[str, uuid.UUID] = {}
    for s in TECH_SUBCATEGORIES:
        obj = TechSubcategory(
            id=uuid.uuid4(),
            dimension_id=dim_map[s["dimension_code"]],
            code=s["code"],
            name=s["name"],
            description=s.get("description"),
            order=s["order"],
        )
        session.add(obj)
        sub_map[s["code"]] = obj.id

    await session.flush()

    # ── questions + competency levels ───────────────────────────────────────
    for q in QUESTIONS:
        qobj = Question(
            id=uuid.uuid4(),
            dimension_id=dim_map[q["dimension_code"]],
            subcategory_id=sub_map.get(q["subcategory_code"]) if q["subcategory_code"] else None,
            text=q["text"],
            order=q["order"],
            weight=q["weight"],
        )
        session.add(qobj)
        await session.flush()

        for level, description in q["levels"].items():
            session.add(CompetencyLevel(
                id=uuid.uuid4(),
                question_id=qobj.id,
                level=level,
                description=description,
            ))

    await session.commit()
    print("Seed complete.")


async def main() -> None:
    async for session in get_db():
        await seed(session)
        break


if __name__ == "__main__":
    asyncio.run(main())
