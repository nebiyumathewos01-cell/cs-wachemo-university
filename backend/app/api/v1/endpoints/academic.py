from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_admin
from app.models.academic import AcademicYear, Semester, Course, Chapter
from app.models.material import Material
from app.schemas.academic import (
    AcademicYearOut, SemesterOut,
    CourseCreate, CourseUpdate, CourseOut, PaginatedCourses,
    ChapterCreate, ChapterUpdate, ChapterOut,
)
from app.models.user import User

router = APIRouter(tags=["Academic"])


# ─── Academic Years ──────────────────────────────────────────

@router.get("/academic-years", response_model=list[AcademicYearOut])
def list_academic_years(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    years = db.query(AcademicYear).order_by(AcademicYear.order).all()
    return [
        AcademicYearOut(
            id=y.id, name=y.name, order=y.order,
            is_available=y.is_available,
            created_at=y.created_at.isoformat(),
        )
        for y in years
    ]


@router.get("/academic-years/{year_id}", response_model=AcademicYearOut)
def get_academic_year(year_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    year = db.query(AcademicYear).filter(AcademicYear.id == year_id).first()
    if not year:
        raise HTTPException(status_code=404, detail="Academic year not found")
    return AcademicYearOut(id=year.id, name=year.name, order=year.order,
                           is_available=year.is_available, created_at=year.created_at.isoformat())


@router.get("/academic-years/{year_id}/semesters", response_model=list[SemesterOut])
def list_semesters(year_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    semesters = (
        db.query(Semester)
        .filter(Semester.academic_year_id == year_id)
        .order_by(Semester.order)
        .all()
    )
    return [
        SemesterOut(id=s.id, name=s.name, order=s.order,
                    academic_year_id=s.academic_year_id, created_at=s.created_at.isoformat())
        for s in semesters
    ]


@router.get("/semesters/{semester_id}", response_model=SemesterOut)
def get_semester(semester_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    sem = db.query(Semester).filter(Semester.id == semester_id).first()
    if not sem:
        raise HTTPException(status_code=404, detail="Semester not found")
    return SemesterOut(id=sem.id, name=sem.name, order=sem.order,
                       academic_year_id=sem.academic_year_id, created_at=sem.created_at.isoformat())


# ─── Courses ─────────────────────────────────────────────────

@router.get("/courses", response_model=PaginatedCourses)
def list_courses(
    academic_year_id: int | None = None,
    semester_id: int | None = None,
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Course)
    if academic_year_id:
        query = query.filter(Course.academic_year_id == academic_year_id)
    if semester_id:
        query = query.filter(Course.semester_id == semester_id)

    total = query.count()
    courses = query.order_by(Course.name).offset((page - 1) * per_page).limit(per_page).all()

    items = []
    for c in courses:
        chapter_count = db.query(func.count(Chapter.id)).filter(Chapter.course_id == c.id).scalar()
        items.append(CourseOut(
            id=c.id, name=c.name, code=c.code, description=c.description,
            academic_year_id=c.academic_year_id, semester_id=c.semester_id,
            chapter_count=chapter_count, created_at=c.created_at.isoformat(),
        ))

    return PaginatedCourses(
        items=items, total=total, page=page,
        per_page=per_page, pages=max(1, -(-total // per_page)),
    )


@router.get("/courses/{course_id}", response_model=CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    chapter_count = db.query(func.count(Chapter.id)).filter(Chapter.course_id == course_id).scalar()
    return CourseOut(
        id=course.id, name=course.name, code=course.code, description=course.description,
        academic_year_id=course.academic_year_id, semester_id=course.semester_id,
        chapter_count=chapter_count, created_at=course.created_at.isoformat(),
    )


@router.post("/courses", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
def create_course(data: CourseCreate, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    course = Course(**data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return CourseOut(
        id=course.id, name=course.name, code=course.code, description=course.description,
        academic_year_id=course.academic_year_id, semester_id=course.semester_id,
        chapter_count=0, created_at=course.created_at.isoformat(),
    )


@router.put("/courses/{course_id}", response_model=CourseOut)
def update_course(course_id: int, data: CourseUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(course, k, v)
    db.commit()
    db.refresh(course)
    chapter_count = db.query(func.count(Chapter.id)).filter(Chapter.course_id == course_id).scalar()
    return CourseOut(
        id=course.id, name=course.name, code=course.code, description=course.description,
        academic_year_id=course.academic_year_id, semester_id=course.semester_id,
        chapter_count=chapter_count, created_at=course.created_at.isoformat(),
    )


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()


# ─── Chapters ────────────────────────────────────────────────

@router.get("/courses/{course_id}/chapters", response_model=list[ChapterOut])
def list_chapters(course_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    chapters = (
        db.query(Chapter)
        .filter(Chapter.course_id == course_id)
        .order_by(Chapter.number)
        .all()
    )
    result = []
    for ch in chapters:
        mat_count = db.query(func.count(Material.id)).filter(Material.chapter_id == ch.id).scalar()
        result.append(ChapterOut(
            id=ch.id, number=ch.number, title=ch.title, description=ch.description,
            course_id=ch.course_id, material_count=mat_count, created_at=ch.created_at.isoformat(),
        ))
    return result


@router.get("/chapters/{chapter_id}", response_model=ChapterOut)
def get_chapter(chapter_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    ch = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not ch:
        raise HTTPException(status_code=404, detail="Chapter not found")
    mat_count = db.query(func.count(Material.id)).filter(Material.chapter_id == chapter_id).scalar()
    return ChapterOut(
        id=ch.id, number=ch.number, title=ch.title, description=ch.description,
        course_id=ch.course_id, material_count=mat_count, created_at=ch.created_at.isoformat(),
    )


@router.post("/chapters", response_model=ChapterOut, status_code=status.HTTP_201_CREATED)
def create_chapter(data: ChapterCreate, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    chapter = Chapter(**data.model_dump())
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return ChapterOut(
        id=chapter.id, number=chapter.number, title=chapter.title,
        description=chapter.description, course_id=chapter.course_id,
        material_count=0, created_at=chapter.created_at.isoformat(),
    )


@router.put("/chapters/{chapter_id}", response_model=ChapterOut)
def update_chapter(chapter_id: int, data: ChapterUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    ch = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not ch:
        raise HTTPException(status_code=404, detail="Chapter not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(ch, k, v)
    db.commit()
    db.refresh(ch)
    mat_count = db.query(func.count(Material.id)).filter(Material.chapter_id == chapter_id).scalar()
    return ChapterOut(
        id=ch.id, number=ch.number, title=ch.title, description=ch.description,
        course_id=ch.course_id, material_count=mat_count, created_at=ch.created_at.isoformat(),
    )


@router.delete("/chapters/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chapter(chapter_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    ch = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not ch:
        raise HTTPException(status_code=404, detail="Chapter not found")
    db.delete(ch)
    db.commit()
