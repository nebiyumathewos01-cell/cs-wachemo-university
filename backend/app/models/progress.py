from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class StudentProgress(Base):
    """Aggregated per-course progress for a student."""
    __tablename__ = "student_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    quiz_attempts_count = Column(Integer, default=0, nullable=False)
    average_score = Column(Float, default=0.0, nullable=False)
    strong_chapters = Column(JSON, default=list, nullable=False)   # list of chapter ids
    weak_chapters = Column(JSON, default=list, nullable=False)     # list of chapter ids
    last_activity = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    student = relationship("User", back_populates="progress_records")
    course = relationship("Course")
