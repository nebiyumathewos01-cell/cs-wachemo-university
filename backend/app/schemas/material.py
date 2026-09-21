from pydantic import BaseModel
from typing import Optional


class MaterialOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    filename: str
    original_filename: str
    file_size: int
    file_type: str
    chapter_id: int
    course_id: int
    has_extracted_text: bool
    created_at: str

    model_config = {"from_attributes": True}


class PastExamOut(BaseModel):
    id: int
    title: str
    course_id: int
    academic_year_id: int
    semester_id: int
    exam_year: int
    exam_type: str
    filename: str
    original_filename: str
    file_size: int
    description: Optional[str]
    created_at: str

    model_config = {"from_attributes": True}


class PaginatedPastExams(BaseModel):
    items: list[PastExamOut]
    total: int
    page: int
    per_page: int
    pages: int
