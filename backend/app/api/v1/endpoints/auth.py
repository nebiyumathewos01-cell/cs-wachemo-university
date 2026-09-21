from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, UserRole
from app.models.academic import AcademicYear
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserOut
from app.auth.dependencies import get_current_user, get_current_student

router = APIRouter(prefix="/auth", tags=["Authentication"])


class YearSelectRequest(BaseModel):
    academic_year_id: int


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    email_clean = data.email.lower().strip()
    # Check duplicate email
    if db.query(User).filter(User.email == email_clean).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    # Username if provided
    username_clean = data.username.strip() if data.username else None
    if username_clean:
        if db.query(User).filter(User.username.ilike(username_clean)).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This username is already taken",
            )

    user = User(
        full_name=data.full_name.strip(),
        username=username_clean,
        email=email_clean,
        hashed_password=hash_password(data.password),
        role=UserRole.student,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id)
    return TokenResponse(access_token=token, user=UserOut.from_orm_obj(user))


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    email_clean = data.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    token = create_access_token(subject=user.id)
    return TokenResponse(access_token=token, user=UserOut.from_orm_obj(user))


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(_: User = Depends(get_current_user)):
    # JWT is stateless; the client simply drops the token.
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.from_orm_obj(current_user)


@router.patch("/me/year", response_model=UserOut)
def select_year(
    data: YearSelectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    """Student selects their active academic year (2nd Year, 3rd Year, etc.)."""
    year = db.query(AcademicYear).filter(AcademicYear.id == data.academic_year_id).first()
    if not year:
        raise HTTPException(status_code=404, detail="Academic year not found")
    if not year.is_available:
        raise HTTPException(
            status_code=400,
            detail=f"{year.name} is not yet available",
        )
    current_user.selected_year_id = year.id
    db.commit()
    db.refresh(current_user)
    return UserOut.from_orm_obj(current_user)
