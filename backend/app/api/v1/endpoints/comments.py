from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.auth.dependencies import get_current_user, get_current_admin
from app.models.user import User, UserRole
from app.models.comment import Comment
from app.schemas.comment import (
    CommentCreate,
    CommentUpdate,
    CommentReply,
    CommentOut,
    PaginatedComments,
)

router = APIRouter(prefix="/comments", tags=["Comments & Feedback"])


@router.post("", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_comment(
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Students/Users submit a comment, question, suggestion, or material request (Direct to Admin)."""
    comment = Comment(
        user_id=current_user.id,
        title=data.title.strip() if data.title else None,
        content=data.content.strip(),
        category=data.category or "General",
        is_private=True,  # Always private between student and admin
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.get("", response_model=PaginatedComments)
def list_comments(
    page: int = 1,
    per_page: int = 20,
    category: Optional[str] = None,
    status_filter: Optional[str] = None,  # all, pending, replied, resolved
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List comments. Admin sees all student comments; Students strictly see only their own submissions."""
    query = db.query(Comment)

    # Privacy control: Students only see their own submissions; Admin sees all
    if current_user.role != UserRole.admin:
        query = query.filter(Comment.user_id == current_user.id)

    # Filter category
    if category and category.lower() != "all":
        query = query.filter(Comment.category == category)

    # Filter status
    if status_filter == "pending":
        query = query.filter(Comment.admin_reply == None, Comment.is_resolved == False)  # noqa: E711, E712
    elif status_filter == "replied":
        query = query.filter(Comment.admin_reply != None)  # noqa: E711
    elif status_filter == "resolved":
        query = query.filter(Comment.is_resolved == True)  # noqa: E712

    # Search in title, content, or user name
    if search:
        query = query.join(User).filter(
            (Comment.title.ilike(f"%{search}%"))
            | (Comment.content.ilike(f"%{search}%"))
            | (User.full_name.ilike(f"%{search}%"))
            | (User.email.ilike(f"%{search}%"))
        )

    total = query.count()
    pending_count = (
        db.query(func.count(Comment.id))
        .filter(Comment.admin_reply == None, Comment.is_resolved == False)  # noqa: E711, E712
        .scalar()
        or 0
    )
    resolved_count = (
        db.query(func.count(Comment.id))
        .filter(Comment.is_resolved == True)  # noqa: E712
        .scalar()
        or 0
    )

    items = (
        query.order_by(Comment.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return PaginatedComments(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=max(1, -(-total // per_page)),
        pending_count=pending_count,
        resolved_count=resolved_count,
    )


@router.get("/my", response_model=PaginatedComments)
def list_my_comments(
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List comments submitted by current user."""
    query = db.query(Comment).filter(Comment.user_id == current_user.id)
    total = query.count()
    items = (
        query.order_by(Comment.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    pending_count = query.filter(Comment.admin_reply == None, Comment.is_resolved == False).count()  # noqa: E711, E712
    resolved_count = query.filter(Comment.is_resolved == True).count()  # noqa: E712

    return PaginatedComments(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=max(1, -(-total // per_page)),
        pending_count=pending_count,
        resolved_count=resolved_count,
    )


@router.put("/{comment_id}/reply", response_model=CommentOut)
def reply_comment(
    comment_id: int,
    data: CommentReply,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """Admin replies to a comment/question."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment.admin_reply = data.admin_reply.strip()
    comment.replied_at = datetime.now(timezone.utc)
    comment.replied_by_name = current_admin.full_name
    db.commit()
    db.refresh(comment)
    return comment


@router.patch("/{comment_id}", response_model=CommentOut)
def update_comment(
    comment_id: int,
    data: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update comment or toggle resolution status (Owner or Admin)."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Only admin or owner can edit
    if current_user.role != UserRole.admin and comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this comment")

    if data.title is not None:
        comment.title = data.title.strip() if data.title else None
    if data.content is not None and current_user.id == comment.user_id:
        comment.content = data.content.strip()
    if data.category is not None:
        comment.category = data.category
    if data.is_private is not None and (current_user.id == comment.user_id or current_user.role == UserRole.admin):
        comment.is_private = data.is_private
    if data.is_resolved is not None:
        comment.is_resolved = data.is_resolved

    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/{comment_id}", status_code=status.HTTP_200_OK)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete comment (Owner or Admin)."""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if current_user.role != UserRole.admin and comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully"}
