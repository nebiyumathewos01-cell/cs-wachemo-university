"""
Agentic Quiz Generator — orchestrates context retrieval and Gemini API calls
to produce grounded, validated MCQ questions.
"""
from __future__ import annotations

import json
import time
import re
from typing import Any

import google.generativeai as genai
from sqlalchemy.orm import Session

from app.core.config import settings
from app.agents.tools import retrieve_course, retrieve_chapter, get_chapter_context
from app.models.question import Difficulty

# Configure Gemini once at module level
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)


DIFFICULTY_DESCRIPTIONS = {
    Difficulty.easy: "basic recall and simple understanding",
    Difficulty.medium: "application and moderate analysis",
    Difficulty.hard: "deep analysis, synthesis, and evaluation",
    Difficulty.exam_practice: "university exam level with comprehensive coverage",
}


def _build_quiz_prompt(
    chapter_title: str,
    course_name: str,
    context: str,
    num_questions: int,
    difficulty: Difficulty,
) -> str:
    diff_desc = DIFFICULTY_DESCRIPTIONS.get(difficulty, "medium difficulty")

    return f"""You are an expert Computer Science educator creating exam questions for university students at Wachemo University.

COURSE: {course_name}
CHAPTER: {chapter_title}
DIFFICULTY: {difficulty.value} ({diff_desc})
NUMBER OF QUESTIONS: {num_questions}

COURSE MATERIAL:
{context if context else "No uploaded material available. Generate general CS questions relevant to the chapter title."}

INSTRUCTIONS:
1. Generate exactly {num_questions} multiple-choice questions based on the course material above.
2. Each question must directly relate to the content of this chapter.
3. Each question must have exactly 4 options labeled A, B, C, D.
4. Each question must have exactly ONE correct answer.
5. Include a clear explanation for why the correct answer is right.
6. Match the difficulty level: {diff_desc}.
7. Do NOT invent specific university policies, exam dates, or grades.
8. Do NOT repeat the same question.

RETURN FORMAT (valid JSON array only, no markdown, no extra text):
[
  {{
    "text": "Question text here?",
    "options": [
      {{"label": "A", "text": "Option A text"}},
      {{"label": "B", "text": "Option B text"}},
      {{"label": "C", "text": "Option C text"}},
      {{"label": "D", "text": "Option D text"}}
    ],
    "correct_label": "B",
    "explanation": "Explanation of why B is correct."
  }}
]"""


def _build_study_prompt(
    chapter_title: str,
    course_name: str,
    context: str,
    question: str,
) -> str:
    return f"""You are a helpful Computer Science tutor at Wachemo University.

COURSE: {course_name}
CHAPTER: {chapter_title}

COURSE MATERIAL:
{context if context else "No uploaded material available. Use general Computer Science knowledge."}

STUDENT QUESTION:
{question}

INSTRUCTIONS:
- Answer the question clearly and accurately.
- Prioritize information from the course material above.
- Keep your answer suitable for a university CS student.
- If the material does not contain enough information, say so and provide a general answer.
- Do NOT invent specific facts about Wachemo University.
- Be concise but thorough.
"""


def _parse_questions(raw: str) -> list[dict]:
    """Parse the AI JSON response into a list of question dicts."""
    # Strip markdown code blocks if present
    raw = re.sub(r"```(?:json)?", "", raw).strip()
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return data
    except json.JSONDecodeError:
        # Try to extract JSON array from the text
        match = re.search(r"\[[\s\S]*\]", raw)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    return []


def _validate_question(q: dict) -> bool:
    """Check that a question dict has the required fields."""
    required = ["text", "options", "correct_label", "explanation"]
    if not all(k in q for k in required):
        return False
    if not isinstance(q["options"], list) or len(q["options"]) < 2:
        return False
    labels = [o.get("label") for o in q["options"]]
    if q["correct_label"] not in labels:
        return False
    return bool(q["text"].strip())


def generate_quiz(
    course_id: int,
    chapter_id: Optional[int],
    num_questions: int,
    difficulty: Difficulty,
    db: Session,
) -> tuple[list[dict[str, Any]], str]:
    """
    Agentic workflow:
    1. Retrieve course
    2. Retrieve chapter (or use comprehensive course topics if chapter_id is None)
    3. Gather material context
    4. Call Gemini
    5. Parse & validate questions
    6. Return validated questions + status
    """
    start = time.time()

    # Step 1-2: Context retrieval
    course = retrieve_course(course_id, db)
    if not course:
        return [], "Course not found"

    chapter = retrieve_chapter(chapter_id, db) if chapter_id else None
    chapter_title = chapter["title"] if chapter else "All Chapters & Comprehensive Course Topics"

    # Step 3: Get material text
    if chapter_id:
        context = get_chapter_context(chapter_id, db, max_chars=8000)
    else:
        from app.agents.tools import get_course_context
        context = get_course_context(course_id, db, max_chars=8000)

    if not settings.GEMINI_API_KEY:
        return [], "GEMINI_API_KEY is not configured"

    # Step 4: Call Gemini
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = _build_quiz_prompt(
            chapter_title=chapter_title,
            course_name=course["name"],
            context=context,
            num_questions=num_questions,
            difficulty=difficulty,
        )
        response = model.generate_content(prompt)
        raw = response.text
    except Exception as e:
        return [], f"failed: {str(e)}"

    # Step 5: Parse and validate
    raw_questions = _parse_questions(raw)
    validated = [q for q in raw_questions if _validate_question(q)]

    return validated, "success"


def answer_study_question(
    course_id: int,
    chapter_id: Optional[int],
    question: str,
    db: Session,
) -> str:
    """Answer a student study question grounded in course materials."""
    course = retrieve_course(course_id, db)
    if not course:
        return "Could not find the specified course."

    chapter = retrieve_chapter(chapter_id, db) if chapter_id else None
    chapter_title = chapter["title"] if chapter else "Comprehensive Course Content"

    if chapter_id:
        context = get_chapter_context(chapter_id, db, max_chars=6000)
    else:
        from app.agents.tools import get_course_context
        context = get_course_context(course_id, db, max_chars=6000)

    if not settings.GEMINI_API_KEY:
        return "AI Study Assistant is not configured. Please contact your administrator."

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = _build_study_prompt(
            chapter_title=chapter_title,
            course_name=course["name"],
            context=context,
            question=question,
        )
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Unable to generate an answer right now. Please try again. ({str(e)})"
