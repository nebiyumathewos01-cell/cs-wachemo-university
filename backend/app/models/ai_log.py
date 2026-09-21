from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class AIGenerationLog(Base):
    __tablename__ = "ai_generation_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="SET NULL"), nullable=True, index=True)
    academic_year_id = Column(Integer, nullable=True)
    course_id = Column(Integer, nullable=True)
    chapter_id = Column(Integer, nullable=True)
    prompt_summary = Column(Text, nullable=True)     # summary of what was requested
    questions_requested = Column(Integer, nullable=False, default=0)
    questions_generated = Column(Integer, nullable=False, default=0)
    questions_validated = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="success")  # success | failed | partial
    error_message = Column(Text, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    student = relationship("User")
    quiz = relationship("Quiz")
