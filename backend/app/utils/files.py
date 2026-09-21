import os
import uuid
import re
from pathlib import Path
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings

ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


def secure_filename(filename: str) -> str:
    """Sanitize a filename by removing dangerous characters."""
    # Keep only safe characters
    filename = re.sub(r"[^\w\s\-.]", "", filename)
    filename = filename.strip().replace(" ", "_")
    # Limit length
    name, ext = os.path.splitext(filename)
    return f"{name[:100]}{ext}"


def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename using UUID."""
    ext = Path(original_filename).suffix.lower()
    return f"{uuid.uuid4().hex}{ext}"


def validate_upload_file(file: UploadFile) -> None:
    """Validate file type and size."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
        )


def get_upload_path(subdir: str = "materials") -> Path:
    """Return the upload directory path, creating it if needed."""
    path = Path(settings.UPLOAD_DIR) / subdir
    path.mkdir(parents=True, exist_ok=True)
    return path


async def save_upload_file(file: UploadFile, subdir: str = "materials") -> tuple[str, str, int]:
    """
    Save an uploaded file and return (unique_filename, original_filename, file_size).
    Validates file size against MAX_FILE_SIZE_MB.
    """
    validate_upload_file(file)

    upload_path = get_upload_path(subdir)
    original_filename = secure_filename(file.filename or "file")
    unique_filename = generate_unique_filename(original_filename)
    file_path = upload_path / unique_filename

    content = await file.read()
    file_size = len(content)

    if file_size > settings.max_file_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_FILE_SIZE_MB} MB",
        )

    with open(file_path, "wb") as f:
        f.write(content)

    return unique_filename, original_filename, file_size


def delete_file_if_exists(filename: str, subdir: str = "materials") -> None:
    """Remove a stored file from the uploads directory."""
    path = Path(settings.UPLOAD_DIR) / subdir / filename
    if path.exists():
        path.unlink()


def extract_text_from_pdf(filename: str, subdir: str = "materials") -> str | None:
    """Extract text content from a PDF using pypdf (pure-Python, no compilation needed)."""
    try:
        from pypdf import PdfReader
        path = Path(settings.UPLOAD_DIR) / subdir / filename
        if not path.exists():
            return None
        reader = PdfReader(str(path))
        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        full_text = "\n".join(text_parts).strip()
        return full_text if full_text else None
    except Exception:
        return None
