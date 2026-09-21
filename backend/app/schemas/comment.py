from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, field_validator


class CommentCreate(BaseModel):
    title: Optional[str] = None
    content: str
    category: str = "General"  # General, Question, Suggestion, Material Request, Bug
    is_private: bool = False

    @field_validator("content")
    @classmethod
    def content_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Comment content cannot be empty")
        return v


class CommentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    is_private: Optional[bool] = None
    is_resolved: Optional[bool] = None


class CommentReply(BaseModel):
    admin_reply: str

    @field_validator("admin_reply")
    @classmethod
    def reply_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Admin reply cannot be empty")
        return v


class CommentUserOut(BaseModel):
    id: int
    full_name: str
    username: Optional[str] = None
    email: str
    role: str

    model_config = {"from_attributes": True}


class CommentOut(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    content: str
    category: str
    is_private: bool
    admin_reply: Optional[str] = None
    replied_at: Optional[datetime] = None
    replied_by_name: Optional[str] = None
    is_resolved: bool
    created_at: datetime
    updated_at: datetime
    user: Optional[CommentUserOut] = None

    model_config = {"from_attributes": True}


class PaginatedComments(BaseModel):
    items: List[CommentOut]
    total: int
    page: int
    per_page: int
    pages: int
    pending_count: int
    resolved_count: int

