from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.user import User, UserRole
from app.models.academic import Course
from app.models.material import Material
from app.models.past_exam import PastExam
from app.models.quiz import QuizAttempt
from app.models.ai_log import AIGenerationLog
from app.models.question import Question
from app.schemas.progress import AnalyticsOut, PaginatedUsers, AdminUserOut

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/analytics", response_model=AnalyticsOut)
def get_analytics(db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    return AnalyticsOut(
        total_students=db.query(func.count(User.id)).filter(User.role == UserRole.student).scalar() or 0,
        total_courses=db.query(func.count(Course.id)).scalar() or 0,
        total_materials=db.query(func.count(Material.id)).scalar() or 0,
        total_past_exams=db.query(func.count(PastExam.id)).scalar() or 0,
        total_quiz_attempts=db.query(func.count(QuizAttempt.id)).scalar() or 0,
    )


@router.get("/students", response_model=PaginatedUsers)
def list_students(
    page: int = 1,
    per_page: int = 20,
    search: str | None = None,
    role_filter: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    from app.models.academic import AcademicYear
    query = db.query(User)
    if role_filter:
        query = query.filter(User.role == role_filter)
    else:
        query = query.filter(User.role == UserRole.student)

    if search:
        query = query.filter(
            (User.full_name.ilike(f"%{search}%"))
            | (User.email.ilike(f"%{search}%"))
            | (User.username.ilike(f"%{search}%"))
        )
    total = query.count()
    students = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    # Pre-fetch year names map
    years = {y.id: y.name for y in db.query(AcademicYear).all()}

    items = []
    for s in students:
        attempts_count = db.query(func.count(QuizAttempt.id)).filter(QuizAttempt.student_id == s.id).scalar() or 0
        items.append(
            AdminUserOut(
                id=s.id,
                full_name=s.full_name,
                username=s.username,
                email=s.email,
                role=s.role.value if hasattr(s.role, "value") else s.role,
                selected_year_id=s.selected_year_id,
                selected_year_name=years.get(s.selected_year_id) if s.selected_year_id else None,
                quiz_attempts_count=attempts_count,
                is_active=s.is_active,
                created_at=s.created_at.isoformat(),
            )
        )

    return PaginatedUsers(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=max(1, -(-total // per_page)),
    )


@router.patch("/students/{user_id}/status")
def toggle_student_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Toggle student active/inactive status."""
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate own admin account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return {"message": f"User {'activated' if user.is_active else 'deactivated'} successfully", "is_active": user.is_active}


@router.put("/students/{user_id}")
def update_student(
    user_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """Admin edits student profile details."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "full_name" in payload and payload["full_name"]:
        user.full_name = payload["full_name"].strip()
    if "username" in payload:
        uname = payload["username"].strip() if payload["username"] else None
        if uname and uname != user.username:
            if db.query(User).filter(User.username.ilike(uname), User.id != user_id).first():
                raise HTTPException(status_code=400, detail="Username already in use")
            user.username = uname
    if "email" in payload and payload["email"]:
        email_clean = payload["email"].strip().lower()
        if email_clean != user.email:
            if db.query(User).filter(User.email == email_clean, User.id != user_id).first():
                raise HTTPException(status_code=400, detail="Email already in use")
            user.email = email_clean
    if "is_active" in payload:
        user.is_active = bool(payload["is_active"])
    if "role" in payload and payload["role"] in ["student", "admin"]:
        user.role = UserRole(payload["role"])

    db.commit()
    db.refresh(user)
    return {"message": "User updated successfully"}


@router.delete("/students/{user_id}")
def delete_student(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Admin deletes a student user account."""
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete own admin account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}


@router.get("/ai-logs")
def list_ai_logs(
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    total = db.query(func.count(AIGenerationLog.id)).scalar() or 0
    logs = (
        db.query(AIGenerationLog)
        .order_by(AIGenerationLog.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    items = [
        {
            "id": lg.id,
            "student_id": lg.student_id,
            "quiz_id": lg.quiz_id,
            "questions_requested": lg.questions_requested,
            "questions_generated": lg.questions_generated,
            "questions_validated": lg.questions_validated,
            "status": lg.status,
            "error_message": lg.error_message,
            "duration_seconds": lg.duration_seconds,
            "created_at": lg.created_at.isoformat(),
        }
        for lg in logs
    ]
    return {"items": items, "total": total, "page": page, "per_page": per_page}


@router.put("/questions/{question_id}/review")
def review_question(
    question_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    action = payload.get("action")
    if action == "approve":
        q.is_approved = True
    elif action == "reject":
        q.is_approved = False
    elif action == "edit":
        if "text" in payload:
            q.text = payload["text"]
        if "explanation" in payload:
            q.explanation = payload["explanation"]
        q.is_approved = True
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approve', 'reject', or 'edit'")

    db.commit()
    return {"message": f"Question {action}d successfully"}
