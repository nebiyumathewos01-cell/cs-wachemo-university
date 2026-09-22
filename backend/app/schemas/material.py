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


# ─── AI Auto-Organizer Schemas ─────────────────────────────────

class AIAnalyzedMaterial(BaseModel):
    filename: str
    original_filename: str
    title: str
    description: Optional[str] = None
    academic_year_name: str
    academic_year_id: Optional[int] = None
    semester_name: str
    semester_id: Optional[int] = None
    course_name: str
    course_id: Optional[int] = None
    chapter_number: int
    chapter_title: str
    chapter_id: Optional[int] = None
    confidence: float
    reasoning: str
    is_new_course: bool
    is_new_chapter: bool


class AIAnalyzeBatchResponse(BaseModel):
    items: list[AIAnalyzedMaterial]
    total_files: int


class AIConfirmMaterialItem(BaseModel):
    filename: str
    original_filename: str
    title: str
    description: Optional[str] = None
    academic_year_id: Optional[int] = None
    academic_year_name: Optional[str] = None
    semester_id: Optional[int] = None
    semester_name: Optional[str] = None
    course_id: Optional[int] = None
    course_name: str
    chapter_id: Optional[int] = None
    chapter_number: int
    chapter_title: str


class AIConfirmBatchRequest(BaseModel):
    items: list[AIConfirmMaterialItem]


class AIConfirmedResultItem(BaseModel):
    material_id: int
    title: str
    course_name: str
    chapter_title: str
    status: str


class AIConfirmBatchResponse(BaseModel):
    message: str
    created_count: int
    results: list[AIConfirmedResultItem]

