from pydantic import BaseModel, EmailStr, field_validator
import re


class RegisterRequest(BaseModel):
    full_name: str
    username: str | None = None
    email: EmailStr
    password: str

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters")
        if len(v) > 100:
            raise ValueError("Full name must be at most 100 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    username: str | None = None
    email: str
    role: str
    selected_year_id: int | None
    is_active: bool
    is_paid: bool = False
    payment_status: str = "unpaid"
    created_at: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_obj(cls, user) -> "UserOut":
        is_admin = (user.role.value if hasattr(user.role, "value") else user.role) == "admin"
        return cls(
            id=user.id,
            full_name=user.full_name,
            username=getattr(user, "username", None),
            email=user.email,
            role=user.role.value if hasattr(user.role, "value") else user.role,
            selected_year_id=user.selected_year_id,
            is_active=user.is_active,
            is_paid=True if is_admin else getattr(user, "is_paid", False),
            payment_status="approved" if is_admin else getattr(user, "payment_status", "unpaid"),
            created_at=user.created_at.isoformat(),
        )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
