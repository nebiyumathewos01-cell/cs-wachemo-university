from pathlib import Path
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.auth.dependencies import get_current_user, get_current_admin
from app.models.past_exam import PastExam
from app.models.user import User
from app.schemas.material import PastExamOut, PaginatedPastExams
from app.utils.files import save_upload_file, delete_file_if_exists

router = APIRouter(tags=["Past Exams"])


@router.get("/past-exams", response_model=PaginatedPastExams)
def list_past_exams(
    academic_year_id: int | None = None,
    semester_id: int | None = None,
    course_id: int | None = None,
    exam_year: int | None = None,
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(PastExam)
    if academic_year_id:
        query = query.filter(PastExam.academic_year_id == academic_year_id)
    if semester_id:
        query = query.filter(PastExam.semester_id == semester_id)
    if course_id:
        query = query.filter(PastExam.course_id == course_id)
    if exam_year:
        query = query.filter(PastExam.exam_year == exam_year)

    total = query.count()
    exams = query.order_by(PastExam.exam_year.desc()).offset((page - 1) * per_page).limit(per_page).all()

    items = [
        PastExamOut(
            id=e.id, title=e.title, course_id=e.course_id,
            academic_year_id=e.academic_year_id, semester_id=e.semester_id,
            exam_year=e.exam_year, exam_type=e.exam_type,
            filename=e.filename, original_filename=e.original_filename,
            file_size=e.file_size, description=e.description,
            created_at=e.created_at.isoformat(),
        )
        for e in exams
    ]
    return PaginatedPastExams(
        items=items, total=total, page=page,
        per_page=per_page, pages=max(1, -(-total // per_page)),
    )


@router.get("/past-exams/{exam_id}", response_model=PastExamOut)
def get_past_exam(exam_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    exam = db.query(PastExam).filter(PastExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Past exam not found")
    return PastExamOut(
        id=exam.id, title=exam.title, course_id=exam.course_id,
        academic_year_id=exam.academic_year_id, semester_id=exam.semester_id,
        exam_year=exam.exam_year, exam_type=exam.exam_type,
        filename=exam.filename, original_filename=exam.original_filename,
        file_size=exam.file_size, description=exam.description,
        created_at=exam.created_at.isoformat(),
    )


@router.post("/past-exams/upload", response_model=PastExamOut, status_code=status.HTTP_201_CREATED)
async def upload_past_exam(
    title: str = Form(...),
    course_id: int = Form(...),
    academic_year_id: int = Form(...),
    semester_id: int = Form(...),
    exam_year: int = Form(...),
    exam_type: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    unique_filename, original_filename, file_size = await save_upload_file(file, "past_exams")

    exam = PastExam(
        title=title.strip(),
        course_id=course_id,
        academic_year_id=academic_year_id,
        semester_id=semester_id,
        exam_year=exam_year,
        exam_type=exam_type.strip(),
        filename=unique_filename,
        original_filename=original_filename,
        file_size=file_size,
        description=description,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    return PastExamOut(
        id=exam.id, title=exam.title, course_id=exam.course_id,
        academic_year_id=exam.academic_year_id, semester_id=exam.semester_id,
        exam_year=exam.exam_year, exam_type=exam.exam_type,
        filename=exam.filename, original_filename=exam.original_filename,
        file_size=exam.file_size, description=exam.description,
        created_at=exam.created_at.isoformat(),
    )


@router.get("/past-exams/{exam_id}/download")
def download_past_exam(exam_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    exam = db.query(PastExam).filter(PastExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Past exam not found")

    file_path = Path(settings.UPLOAD_DIR) / "past_exams" / exam.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(
        path=str(file_path),
        filename=exam.original_filename,
        media_type="application/octet-stream",
    )


@router.delete("/past-exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_past_exam(exam_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    exam = db.query(PastExam).filter(PastExam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Past exam not found")
    delete_file_if_exists(exam.filename, "past_exams")
    db.delete(exam)
    db.commit()
