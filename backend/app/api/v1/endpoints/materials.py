import os
from pathlib import Path
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
