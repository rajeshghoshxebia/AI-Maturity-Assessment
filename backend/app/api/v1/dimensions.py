from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, CurrentUser
from app.db.session import get_db
from app.repositories.dimension import DimensionRepository
from app.schemas.dimension import DimensionOut

router = APIRouter()


@router.get("", response_model=list[DimensionOut])
async def list_dimensions(
    _: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[DimensionOut]:
    repo = DimensionRepository(db)
    dims = await repo.list_all_with_questions()
    return [DimensionOut.model_validate(d) for d in dims]
