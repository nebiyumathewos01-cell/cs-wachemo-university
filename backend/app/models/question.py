from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class QuestionType(str, enum.Enum):
    mcq = "mcq"
    true_false = "true_false"
    short_answer = "short_answer"


class Difficulty(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"
    exam_practice = "exam_practice"


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    question_type = Column(SAEnum(QuestionType), nullable=False, default=QuestionType.mcq)
    difficulty = Column(SAEnum(Difficulty), nullable=False, default=Difficulty.medium)
    explanation = Column(Text, nullable=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    is_ai_generated = Column(Boolean, default=False, nullable=False)
    is_approved = Column(Boolean, default=True, nullable=False)  # AI questions start as pending if False
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan")
    chapter = relationship("Chapter", back_populates="questions")
    course = relationship("Course", back_populates="questions")


class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(5), nullable=False)      # "A", "B", "C", "D"
    text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)

    # Relationships
    question = relationship("Question", back_populates="options")
