from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Enum as SAEnum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class BookmarkType(str, enum.Enum):
    course = "course"
    chapter = "chapter"
    material = "material"
    question = "question"
    past_exam = "past_exam"


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    bookmark_type = Column(SAEnum(BookmarkType), nullable=False)
    reference_id = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    student = relationship("User", back_populates="bookmarks")
