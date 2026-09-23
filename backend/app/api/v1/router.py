from fastapi import APIRouter
from app.api.v1.endpoints import auth, academic, materials, past_exams, quiz, progress, admin, comments, payments, coding

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(payments.router)
api_router.include_router(academic.router)
api_router.include_router(materials.router)
api_router.include_router(past_exams.router)
api_router.include_router(quiz.router)
api_router.include_router(progress.router)
api_router.include_router(admin.router)
api_router.include_router(comments.router)
api_router.include_router(coding.router)
