from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.auth.dependencies import get_current_student, get_current_user
from app.models.quiz import QuizAttempt, QuizStatus
from app.models.progress import StudentProgress
from app.models.academic import Course, AcademicYear
from app.models.bookmark import Bookmark
from app.models.user import User
from app.schemas.progress import (
    StudentProgressOut, YearProgressOut, CourseProgressOut,
    BookmarkOut, BookmarkCreate,
)

router = APIRouter(tags=["Progress & Bookmarks"])


@router.get("/progress", response_model=StudentProgressOut)
def get_my_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    progress_records = (
        db.query(StudentProgress)
        .filter(StudentProgress.student_id == current_user.id)
        .all()
    )

    total_quizzes = (
        db.query(func.count(QuizAttempt.id))
        .filter(
            QuizAttempt.student_id == current_user.id,
            QuizAttempt.status == QuizStatus.completed,
        )
        .scalar() or 0
    )

    total_mock_exams = (
        db.query(func.count(QuizAttempt.id))
        .join(QuizAttempt.quiz)
        .filter(
            QuizAttempt.student_id == current_user.id,
            QuizAttempt.status == QuizStatus.completed,
        )
        .scalar() or 0
    )

    overall_scores = [p.average_score for p in progress_records if p.quiz_attempts_count > 0]
    overall_average = sum(overall_scores) / len(overall_scores) if overall_scores else 0.0

    # Group by year
    years = db.query(AcademicYear).order_by(AcademicYear.order).all()
    by_year = []
    for year in years:
        courses = db.query(Course).filter(Course.academic_year_id == year.id).all()
        course_progress_list = []
        for course in courses:
            pr = next((p for p in progress_records if p.course_id == course.id), None)
            course_progress_list.append(CourseProgressOut(
                course_id=course.id,
                course_name=course.name,
                quiz_attempts=pr.quiz_attempts_count if pr else 0,
                average_score=pr.average_score if pr else 0.0,
                strong_chapters=pr.strong_chapters if pr else [],
                weak_chapters=pr.weak_chapters if pr else [],
            ))
        if course_progress_list:
            by_year.append(YearProgressOut(year_name=year.name, courses=course_progress_list))

    return StudentProgressOut(
        student_id=current_user.id,
        by_year=by_year,
        total_quizzes=total_quizzes,
        total_mock_exams=total_mock_exams,
        overall_average=overall_average,
    )


# ─── Bookmarks ───────────────────────────────────────────────

@router.get("/bookmarks", response_model=list[BookmarkOut])
def get_bookmarks(db: Session = Depends(get_db), current_user: User = Depends(get_current_student)):
    bookmarks = (
        db.query(Bookmark)
        .filter(Bookmark.student_id == current_user.id)
        .order_by(Bookmark.created_at.desc())
        .all()
    )
    return [
        BookmarkOut(
            id=b.id, student_id=b.student_id,
            bookmark_type=b.bookmark_type.value,
            reference_id=b.reference_id, title=b.title,
            created_at=b.created_at.isoformat(),
        )
        for b in bookmarks
    ]


@router.post("/bookmarks", response_model=BookmarkOut, status_code=201)
def add_bookmark(
    data: BookmarkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    bookmark = Bookmark(
        student_id=current_user.id,
        bookmark_type=data.bookmark_type,
        reference_id=data.reference_id,
        title=data.title,
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return BookmarkOut(
        id=bookmark.id, student_id=bookmark.student_id,
        bookmark_type=bookmark.bookmark_type.value,
        reference_id=bookmark.reference_id, title=bookmark.title,
        created_at=bookmark.created_at.isoformat(),
    )


@router.delete("/bookmarks/{bookmark_id}", status_code=204)
def remove_bookmark(
    bookmark_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    bookmark = db.query(Bookmark).filter(
        Bookmark.id == bookmark_id,
        Bookmark.student_id == current_user.id,
    ).first()
    if not bookmark:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(bookmark)
    db.commit()
