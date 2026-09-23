from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ProblemExample(BaseModel):
    input: str
    output: str
    explanation: Optional[str] = None


class TestCaseItem(BaseModel):
    input: str
    expected_output: str
    is_hidden: Optional[bool] = False


class StarterCode(BaseModel):
    python: str
    cpp: str
    java: str
    javascript: str


class CodingProblemOut(BaseModel):
    id: int
    title: str
    slug: str
    difficulty: str  # Easy, Medium, Hard
    category: str
    description: str
    constraints: Optional[str] = None
    examples: List[Dict[str, Any]]
    starter_code: Dict[str, str]
    points: int
    is_solved: Optional[bool] = False

    class Config:
        from_attributes = True


class TestCaseResult(BaseModel):
    test_case: int
    input: str
    expected_output: str
    actual_output: str
    passed: bool
    execution_time_ms: float
    error: Optional[str] = None


class CodingRunRequest(BaseModel):
    language: str  # python, cpp, java, javascript
    code: str


class CodingRunResponse(BaseModel):
    passed: bool
    passed_count: int
    total_count: int
    test_results: List[TestCaseResult]
    runtime_ms: float
    memory_mb: float
    error: Optional[str] = None


class CodingSubmitRequest(BaseModel):
    language: str
    code: str


class CodingSubmitResponse(BaseModel):
    submission_id: int
    status: str  # Accepted, Wrong Answer, etc.
    passed_count: int
    total_count: int
    runtime_ms: float
    memory_mb: float
    xp_awarded: int
    error_message: Optional[str] = None


class AIExplainRequest(BaseModel):
    language: Optional[str] = "python"
    code: Optional[str] = None


class AIExplainResponse(BaseModel):
    explanation: str


class UserCodingStats(BaseModel):
    solved_count: int
    total_count: int
    easy_solved: int
    medium_solved: int
    hard_solved: int
    streak: int
    total_xp: int
    completion_percentage: float
