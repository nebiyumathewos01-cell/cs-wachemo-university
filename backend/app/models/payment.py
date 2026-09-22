from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    amount = Column(Integer, default=50, nullable=False)
    currency = Column(String(10), default="ETB", nullable=False)
    bank_name = Column(String(100), default="Commercial Bank of Ethiopia (CBE)", nullable=False)
    account_number = Column(String(50), default="1000503206505", nullable=False)
    account_name = Column(String(100), default="Nebiyu Mathewos", nullable=False)
    
    transaction_reference = Column(String(100), unique=True, index=True, nullable=False)
    sender_name = Column(String(100), nullable=False)
    phone_number = Column(String(30), nullable=True)
    
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending, approved, rejected
    admin_notes = Column(Text, nullable=True)
    
    reviewed_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="payments", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])
