from pydantic import BaseModel
from typing import Optional


# ─── Academic Year ────────────────────────────────────────────
class AcademicYearOut(BaseModel):
    id: int
    name: str
    order: int
    is_available: bool
    created_at: str

    model_config = {"from_attributes": True}


# ─── Semester ─────────────────────────────────────────────────
class SemesterOut(BaseModel):
    id: int
    name: str
    order: int
    academic_year_id: int
    created_at: str

    model_config = {"from_attributes": True}


# ─── Course ───────────────────────────────────────────────────
class CourseCreate(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    academic_year_id: int
    semester_id: int


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    academic_year_id: Optional[int] = None
    semester_id: Optional[int] = None


class CourseOut(BaseModel):
    id: int
    name: str
    code: Optional[str]
    description: Optional[str]
    academic_year_id: int
    semester_id: int
    chapter_count: Optional[int] = None
    created_at: str

    model_config = {"from_attributes": True}


# ─── Chapter ──────────────────────────────────────────────────
class ChapterCreate(BaseModel):
    number: int
    title: str
    description: Optional[str] = None
    course_id: int


class ChapterUpdate(BaseModel):
    number: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None


class ChapterOut(BaseModel):
    id: int
    number: int
    title: str
    description: Optional[str]
    course_id: int
    material_count: Optional[int] = None
    created_at: str

    model_config = {"from_attributes": True}


# ─── Paginated ────────────────────────────────────────────────
class PaginatedCourses(BaseModel):
    items: list[CourseOut]
    total: int
    page: int
    per_page: int
    pages: int
