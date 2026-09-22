"""
Agentic AI Tools — functions the Quiz Agent can call to gather context
before generating questions or answering study questions.
"""
from __future__ import annotations

from sqlalchemy.orm import Session
from app.models.academic import AcademicYear, Semester, Course, Chapter
from app.models.material import Material


def retrieve_course(course_id: int, db: Session) -> dict | None:
    """Retrieve course metadata."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        return None
    return {
        "id": course.id,
        "name": course.name,
        "code": course.code,
        "description": course.description,
        "academic_year_id": course.academic_year_id,
        "semester_id": course.semester_id,
    }


def retrieve_chapter(chapter_id: int, db: Session) -> dict | None:
    """Retrieve chapter metadata."""
    ch = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not ch:
        return None
    return {
        "id": ch.id,
        "number": ch.number,
        "title": ch.title,
        "description": ch.description,
        "course_id": ch.course_id,
    }


def retrieve_materials(chapter_id: int, db: Session) -> list[dict]:
    """Retrieve all materials for a chapter, including extracted text."""
    materials = db.query(Material).filter(Material.chapter_id == chapter_id).all()
    return [
        {
            "id": m.id,
            "title": m.title,
            "has_text": m.has_extracted_text,
            "text": m.extracted_text or "",
        }
        for m in materials
    ]


def search_material_content(chapter_id: int, query: str, db: Session) -> str:
    """Search material text for relevant sections (basic keyword search)."""
    materials = db.query(Material).filter(
        Material.chapter_id == chapter_id,
        Material.has_extracted_text == True,
    ).all()

    relevant_parts = []
    query_lower = query.lower()
    for mat in materials:
        if not mat.extracted_text:
            continue
        # Split into paragraphs and find relevant ones
        paragraphs = mat.extracted_text.split("\n\n")
        for para in paragraphs:
            if query_lower in para.lower():
                relevant_parts.append(para.strip())

    return "\n\n".join(relevant_parts[:10])  # Return top 10 relevant paragraphs


def get_chapter_context(chapter_id: int, db: Session, max_chars: int = 8000) -> str:
    """
    Combine all material text for a chapter into a single context string,
    truncated to max_chars for the AI prompt.
    """
    materials = db.query(Material).filter(
        Material.chapter_id == chapter_id,
        Material.has_extracted_text == True,
    ).all()

    if not materials:
        return ""

    parts = []
    for mat in materials:
        if mat.extracted_text:
            parts.append(f"[Material: {mat.title}]\n{mat.extracted_text}")

    full_text = "\n\n---\n\n".join(parts)
    return full_text[:max_chars]


def get_course_context(course_id: int, db: Session, max_chars: int = 8000) -> str:
    """
    Combine material text across all chapters of a course.
    """
    materials = db.query(Material).filter(
        Material.course_id == course_id,
        Material.has_extracted_text == True,
    ).all()

    if not materials:
        return ""

    parts = []
    for mat in materials:
        if mat.extracted_text:
            parts.append(f"[Material: {mat.title}]\n{mat.extracted_text}")

    full_text = "\n\n---\n\n".join(parts)
    return full_text[:max_chars]
