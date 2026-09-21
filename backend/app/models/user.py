from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    student = "student"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.student)
    selected_year_id = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    quiz_attempts = relationship("QuizAttempt", back_populates="student", lazy="dynamic")
    bookmarks = relationship("Bookmark", back_populates="student", lazy="dynamic")
    progress_records = relationship("StudentProgress", back_populates="student", lazy="dynamic")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan", lazy="dynamic")
