from pydantic import BaseModel
from typing import List, Optional


class CourseProgressOut(BaseModel):
    course_id: int
    course_name: str
    quiz_attempts: int
    average_score: float
    strong_chapters: List[str]
    weak_chapters: List[str]


class YearProgressOut(BaseModel):
    year_name: str
    courses: List[CourseProgressOut]


class StudentProgressOut(BaseModel):
    student_id: int
    by_year: List[YearProgressOut]
    total_quizzes: int
    total_mock_exams: int
    overall_average: float


class BookmarkOut(BaseModel):
    id: int
    student_id: int
    bookmark_type: str
    reference_id: int
    title: str
    created_at: str

    model_config = {"from_attributes": True}


class BookmarkCreate(BaseModel):
    bookmark_type: str
    reference_id: int
    title: str


class AdminUserOut(BaseModel):
    id: int
    full_name: str
    username: Optional[str] = None
    email: str
    role: str
    selected_year_name: Optional[str] = None
    selected_year_id: Optional[int] = None
    quiz_attempts_count: int = 0
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


class PaginatedUsers(BaseModel):
    items: List[AdminUserOut]
    total: int
    page: int
    per_page: int
    pages: int


class AnalyticsOut(BaseModel):
    total_students: int
    total_courses: int
    total_materials: int
    total_past_exams: int
    total_quiz_attempts: int
