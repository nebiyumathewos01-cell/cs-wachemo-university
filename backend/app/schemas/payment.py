from typing import List, Optional
from pydantic import BaseModel, field_validator


class PaymentSubmitRequest(BaseModel):
    transaction_reference: str
    sender_name: str
    phone_number: Optional[str] = None
    amount: int = 50

    @field_validator("transaction_reference")
    @classmethod
    def validate_reference(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 4:
            raise ValueError("Transaction reference must be at least 4 characters long")
        return v

    @field_validator("sender_name")
    @classmethod
    def validate_sender(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Sender name must be at least 2 characters")
        return v


class PaymentReviewRequest(BaseModel):
    status: str  # "approved" or "rejected"
    admin_notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in ["approved", "rejected"]:
            raise ValueError("Status must be either 'approved' or 'rejected'")
        return v


class PaymentOut(BaseModel):
    id: int
    user_id: int
    amount: int
    currency: str
    bank_name: str
    account_number: str
    account_name: str
    transaction_reference: str
    sender_name: str
    phone_number: Optional[str] = None
    status: str
    admin_notes: Optional[str] = None
    reviewed_at: Optional[str] = None
    created_at: str
    user_full_name: Optional[str] = None
    user_email: Optional[str] = None
    user_username: Optional[str] = None

    model_config = {"from_attributes": True}


class PaginatedPayments(BaseModel):
    items: List[PaymentOut]
    total: int
    page: int
    per_page: int
    pages: int
    pending_count: int
    approved_count: int
    rejected_count: int


class PaymentStatusResponse(BaseModel):
    is_paid: bool
    payment_status: str  # "unpaid", "pending", "approved", "rejected"
    price_etb: int = 50
    regular_price_etb: int = 100
    is_promo: bool = True
    promo_deadline: str = "September 30, 2026"
    bank_name: str = "Commercial Bank of Ethiopia (CBE)"
    account_number: str = "1000503206505"
    account_name: str = "Nebiyu Mathewos"
    last_payment: Optional[PaymentOut] = None


# Interactive Demo Schemas
class DemoQuestionOption(BaseModel):
    id: int
    label: str
    text: str
    is_correct: bool


class DemoQuestion(BaseModel):
    id: int
    course_name: str
    topic: str
    difficulty: str
    text: str
    options: List[DemoQuestionOption]
    explanation: str


class DemoAIAnswer(BaseModel):
    prompt: str
    topic: str
    response_markdown: str
