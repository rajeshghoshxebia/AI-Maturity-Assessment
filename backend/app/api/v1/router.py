from fastapi import APIRouter

from app.api.v1 import assessments, dimensions, invitations, leads, organizations, questions, reports, responses, survey_public

router = APIRouter()
router.include_router(dimensions.router, prefix="/dimensions", tags=["dimensions"])
router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
router.include_router(assessments.router, prefix="/assessments", tags=["assessments"])
router.include_router(responses.router, prefix="/assessments/{assessment_id}/responses", tags=["responses"])
router.include_router(invitations.router, prefix="/assessments/{assessment_id}/invitations", tags=["invitations"])
router.include_router(reports.router, prefix="/assessments", tags=["reports"])
router.include_router(questions.router, prefix="/questions", tags=["questions"])
router.include_router(leads.router, prefix="/leads", tags=["leads"])
router.include_router(survey_public.router, prefix="/survey", tags=["survey"])
