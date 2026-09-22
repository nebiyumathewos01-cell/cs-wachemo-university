import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.auth.dependencies import get_current_user, get_current_admin
from app.models.material import Material
from app.models.academic import Chapter, Course
from app.models.user import User
from app.schemas.material import MaterialOut
from app.utils.files import save_upload_file, delete_file_if_exists, extract_text_from_pdf

router = APIRouter(tags=["Materials"])


@router.post("/materials/upload", response_model=MaterialOut, status_code=status.HTTP_201_CREATED)
async def upload_material(
    title: str = Form(...),
    description: str = Form(None),
    chapter_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    # Validate chapter exists
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    unique_filename, original_filename, file_size = await save_upload_file(file, "materials")

    # Extract text from PDF
    extracted_text = None
    if original_filename.lower().endswith(".pdf"):
        extracted_text = extract_text_from_pdf(unique_filename, "materials")

    material = Material(
        title=title.strip(),
        description=description,
        filename=unique_filename,
        original_filename=original_filename,
        file_size=file_size,
        file_type=Path(original_filename).suffix.lower().lstrip("."),
        chapter_id=chapter_id,
        course_id=chapter.course_id,
        extracted_text=extracted_text,
        has_extracted_text=bool(extracted_text),
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    return MaterialOut(
        id=material.id, title=material.title, description=material.description,
        filename=material.filename, original_filename=material.original_filename,
        file_size=material.file_size, file_type=material.file_type,
        chapter_id=material.chapter_id, course_id=material.course_id,
        has_extracted_text=material.has_extracted_text,
        created_at=material.created_at.isoformat(),
    )


@router.get("/materials/{material_id}", response_model=MaterialOut)
def get_material(material_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    mat = db.query(Material).filter(Material.id == material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    return MaterialOut(
        id=mat.id, title=mat.title, description=mat.description,
        filename=mat.filename, original_filename=mat.original_filename,
        file_size=mat.file_size, file_type=mat.file_type,
        chapter_id=mat.chapter_id, course_id=mat.course_id,
        has_extracted_text=mat.has_extracted_text,
        created_at=mat.created_at.isoformat(),
    )


@router.get("/chapters/{chapter_id}/materials", response_model=list[MaterialOut])
def list_materials(chapter_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    materials = db.query(Material).filter(Material.chapter_id == chapter_id).all()
    return [
        MaterialOut(
            id=m.id, title=m.title, description=m.description,
            filename=m.filename, original_filename=m.original_filename,
            file_size=m.file_size, file_type=m.file_type,
            chapter_id=m.chapter_id, course_id=m.course_id,
            has_extracted_text=m.has_extracted_text,
            created_at=m.created_at.isoformat(),
        )
        for m in materials
    ]


@router.get("/materials/{material_id}/download")
def download_material(material_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    mat = db.query(Material).filter(Material.id == material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")

    file_path = Path(settings.UPLOAD_DIR) / "materials" / mat.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(
        path=str(file_path),
        filename=mat.original_filename,
        media_type="application/octet-stream",
    )


@router.delete("/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(material_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    mat = db.query(Material).filter(Material.id == material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    delete_file_if_exists(mat.filename, "materials")
    db.delete(mat)
    db.commit()


# ─── AI Auto-Organizer Endpoints ───────────────────────────────

from app.models.academic import AcademicYear, Semester
from app.agents.material_classifier_agent import analyze_material_with_agent
from app.schemas.material import (
    AIAnalyzeBatchResponse,
    AIAnalyzedMaterial,
    AIConfirmBatchRequest,
    AIConfirmBatchResponse,
    AIConfirmedResultItem,
)


@router.post("/materials/ai-analyze-batch", response_model=AIAnalyzeBatchResponse)
async def ai_analyze_batch_materials(
    files: list[UploadFile] = File(...),
    academic_year_id: Optional[int] = Form(None),
    semester_id: Optional[int] = Form(None),
    course_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """
    Bulk upload files with optional Year & Semester context.
    AI Agent scans each file's title and content to identify Course and Chapter.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided for analysis.")

    analyzed_items = []
    for file in files:
        # Save file to uploads
        unique_filename, original_filename, file_size = await save_upload_file(file, "materials")

        # Extract text from PDF if applicable
        extracted_text = None
        if original_filename.lower().endswith(".pdf"):
            extracted_text = extract_text_from_pdf(unique_filename, "materials")

        # Run AI Classifier Agent with year/semester guidance
        analysis = analyze_material_with_agent(
            filename=unique_filename,
            original_filename=original_filename,
            extracted_text=extracted_text,
            db=db,
            academic_year_id=academic_year_id,
            semester_id=semester_id,
            course_id=course_id,
        )
        analyzed_items.append(AIAnalyzedMaterial(**analysis))

    return AIAnalyzeBatchResponse(
        items=analyzed_items,
        total_files=len(analyzed_items),
    )


@router.post("/materials/ai-confirm-batch", response_model=AIConfirmBatchResponse)
def ai_confirm_batch_materials(
    req: AIConfirmBatchRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    """
    Commit and save AI-analyzed materials.
    Automatically creates missing Courses and Chapters if needed.
    """
    if not req.items:
        raise HTTPException(status_code=400, detail="No items to organize.")

    results = []
    for item in req.items:
        # 1. Resolve Academic Year
        year = None
        if item.academic_year_id:
            year = db.query(AcademicYear).filter(AcademicYear.id == item.academic_year_id).first()
        if not year and item.academic_year_name:
            year = db.query(AcademicYear).filter(AcademicYear.name.ilike(f"%{item.academic_year_name}%")).first()
        if not year:
            year = db.query(AcademicYear).order_by(AcademicYear.order).first()

        year_id = year.id if year else 1

        # 2. Resolve Semester
        sem = None
        if item.semester_id:
            sem = db.query(Semester).filter(Semester.id == item.semester_id).first()
        if not sem and item.semester_name and year:
            sem = db.query(Semester).filter(
                Semester.academic_year_id == year.id,
                Semester.name.ilike(f"%{item.semester_name}%"),
            ).first()
        if not sem and year:
            sem = db.query(Semester).filter(Semester.academic_year_id == year.id).order_by(Semester.order).first()

        sem_id = sem.id if sem else 1

        # 3. Resolve Course (create if doesn't exist)
        course = None
        if item.course_id:
            course = db.query(Course).filter(Course.id == item.course_id).first()
        if not course and item.course_name:
            course = db.query(Course).filter(Course.name.ilike(f"%{item.course_name.strip()}%")).first()

        if not course:
            course = Course(
                name=item.course_name.strip(),
                academic_year_id=year_id,
                semester_id=sem_id,
                description=f"Core Computer Science course for {item.academic_year_name or '2nd Year'}",
            )
            db.add(course)
            db.commit()
            db.refresh(course)

        # 4. Resolve Chapter (create if doesn't exist)
        chapter = None
        if item.chapter_id:
            chapter = db.query(Chapter).filter(Chapter.id == item.chapter_id).first()
        if not chapter:
            chapter = db.query(Chapter).filter(
                Chapter.course_id == course.id,
                Chapter.number == item.chapter_number,
            ).first()

        if not chapter:
            chapter = Chapter(
                course_id=course.id,
                number=item.chapter_number,
                title=item.chapter_title.strip() or f"Chapter {item.chapter_number}",
                description=f"Chapter {item.chapter_number} lecture and study materials.",
            )
            db.add(chapter)
            db.commit()
            db.refresh(chapter)

        # 5. Attach Material
        file_path = Path(settings.UPLOAD_DIR) / "materials" / item.filename
        file_size = file_path.stat().st_size if file_path.exists() else 0
        file_ext = Path(item.original_filename).suffix.lower().lstrip(".")

        extracted_text = None
        if file_ext == "pdf":
            extracted_text = extract_text_from_pdf(item.filename, "materials")

        material = Material(
            title=item.title.strip() or item.original_filename,
            description=item.description,
            filename=item.filename,
            original_filename=item.original_filename,
            file_size=file_size,
            file_type=file_ext,
            chapter_id=chapter.id,
            course_id=course.id,
            extracted_text=extracted_text,
            has_extracted_text=bool(extracted_text),
        )
        db.add(material)
        db.commit()
        db.refresh(material)

        results.append(
            AIConfirmedResultItem(
                material_id=material.id,
                title=material.title,
                course_name=course.name,
                chapter_title=f"Ch.{chapter.number} {chapter.title}",
                status="Organized & Live",
            )
        )

    return AIConfirmBatchResponse(
        message=f"Successfully organized {len(results)} materials into their respective courses and chapters.",
        created_count=len(results),
        results=results,
    )

