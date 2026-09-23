from pydantic import BaseModel, field_validator
from typing import Optional, List
from app.models.question import Difficulty, QuestionType


class QuestionOptionOut(BaseModel):
    id: int
    label: str
    text: str
    is_correct: bool

    model_config = {"from_attributes": True}


class QuestionOut(BaseModel):
    id: int
    text: str
    question_type: str
    difficulty: str
    explanation: Optional[str]
    chapter_id: Optional[int]
    course_id: int
    options: List[QuestionOptionOut] = []
    created_at: str

    model_config = {"from_attributes": True}


class QuizOut(BaseModel):
    id: int
    title: str
    chapter_id: Optional[int]
    course_id: int
    academic_year_id: int
    material_id: Optional[int] = None
    difficulty: str
    question_count: int
    is_mock_exam: bool
    time_limit_minutes: Optional[int]
    questions: List[QuestionOut] = []
    created_at: str

    model_config = {"from_attributes": True}


class GenerateQuizRequest(BaseModel):
    academic_year_id: int
    semester_id: int
    course_id: int
    chapter_id: Optional[int] = None
    num_questions: int
    difficulty: Difficulty

    @field_validator("num_questions")
    @classmethod
    def validate_count(cls, v: int) -> int:
        if not 1 <= v <= 50:
            raise ValueError("Number of questions must be between 1 and 50")
        return v


class GenerateMaterialQuizRequest(BaseModel):
    material_id: int
    num_questions: int = 10
    difficulty: str = "medium"       # "easy", "medium", "hard", "mixed"
    question_type: str = "mcq"       # "mcq", "true_false", "all"

    @field_validator("num_questions")
    @classmethod
    def validate_count(cls, v: int) -> int:
        if not 1 <= v <= 50:
            raise ValueError("Number of questions must be between 1 and 50")
        return v


class MockExamRequest(BaseModel):
    academic_year_id: int
    semester_id: int
    course_id: int
    chapter_ids: List[int]
    num_questions: int
    difficulty: Difficulty
    time_limit_minutes: int = 60

    @field_validator("num_questions")
    @classmethod
    def validate_count(cls, v: int) -> int:
        if not 5 <= v <= 100:
            raise ValueError("Mock exam must have between 5 and 100 questions")
        return v


class AnswerSubmit(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None
    text_answer: Optional[str] = None


class QuizSubmitRequest(BaseModel):
    answers: List[AnswerSubmit]


class AnswerResult(BaseModel):
    question: QuestionOut
    selected_option_id: Optional[int]
    is_correct: bool
    correct_option_id: Optional[int]


class AILearningFeedback(BaseModel):
    performance_summary: str
    strengths: List[str] = []
    weak_topics: List[str] = []
    review_sections: List[str] = []
    recommendations: List[str] = []
    practice_tips: List[str] = []


class QuizResult(BaseModel):
    attempt_id: int
    score: float
    total_questions: int
    correct_answers: int
    incorrect_answers: int
    answers: List[AnswerResult]
    weak_topics: List[str]
    recommendations: List[str]
    ai_feedback: Optional[AILearningFeedback] = None


class QuizAttemptOut(BaseModel):
    id: int
    quiz_id: int
    student_id: int
    status: str
    score: Optional[float]
    total_questions: int
    correct_answers: Optional[int]
    started_at: str
    completed_at: Optional[str]

    model_config = {"from_attributes": True}


class StudyRequest(BaseModel):
    academic_year_id: int
    course_id: int
    chapter_id: Optional[int] = None
    question: str

    @field_validator("question")
    @classmethod
    def question_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Question is too short")
        if len(v) > 2000:
            raise ValueError("Question is too long (max 2000 chars)")
        return v


class StudyResponse(BaseModel):
    answer: str
    sources: List[dict] = []
