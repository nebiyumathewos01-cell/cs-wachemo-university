from datetime import datetime, timezone
import json
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Float, String, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class CodingProblem(Base):
    __tablename__ = "coding_problems"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    difficulty = Column(String(20), nullable=False, default="Easy")  # Easy, Medium, Hard
    category = Column(String(100), nullable=False, default="Programming Fundamentals")
    description = Column(Text, nullable=False)
    constraints = Column(Text, nullable=True)
    examples = Column(JSON, nullable=False, default=list)  # list of dicts: [{input, output, explanation}]
    test_cases = Column(JSON, nullable=False, default=list)  # list of dicts: [{input, expected_output, is_hidden}]
    starter_code = Column(JSON, nullable=False, default=dict)  # dict: {python, cpp, java, javascript}
    points = Column(Integer, default=10, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    submissions = relationship("CodingSubmission", back_populates="problem", cascade="all, delete-orphan")


class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_id = Column(Integer, ForeignKey("coding_problems.id", ondelete="CASCADE"), nullable=False, index=True)
    language = Column(String(30), nullable=False)  # python, cpp, java, javascript
    code = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="Accepted")  # Accepted, Wrong Answer, Compilation Error, Runtime Error
    passed_count = Column(Integer, default=0, nullable=False)
    total_count = Column(Integer, default=0, nullable=False)
    runtime_ms = Column(Float, default=0.0)
    memory_mb = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
    problem = relationship("CodingProblem", back_populates="submissions")
