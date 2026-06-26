from fastapi import APIRouter

from app.api.v1 import assessments, dimensions, questions, responses

router = APIRouter()
router.include_router(dimensions.router, prefix="/dimensions", tags=["dimensions"])
router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
router.include_router(responses.router, prefix="/assessments/{assessment_id}/responses", tags=["responses"])
router.include_router(questions.router, prefix="/questions", tags=["questions"])
