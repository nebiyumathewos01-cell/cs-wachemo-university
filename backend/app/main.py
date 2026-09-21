"""
CS Wachemo University — FastAPI Backend
"""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables and seed initial data."""
    # Import all models so SQLAlchemy can create tables
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)

    # Ensure upload directories exist
    Path(settings.UPLOAD_DIR + "/materials").mkdir(parents=True, exist_ok=True)
    Path(settings.UPLOAD_DIR + "/past_exams").mkdir(parents=True, exist_ok=True)

    # Seed initial data
    _seed_database()

    yield
    # Cleanup (none needed for now)


def _seed_database() -> None:
    """Seed academic years, semesters, and admin user on first run or ensure updated."""
    from app.models.user import User, UserRole
    from app.models.academic import AcademicYear, Semester
    from app.core.security import hash_password
    from sqlalchemy import text

    db = SessionLocal()
    try:
        # Check if username column exists in users table, add if missing
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);"))
            db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username);"))
            db.commit()
        except Exception as col_err:
            db.rollback()
            print(f"[DB MIGRATION NOTE] {col_err}")

        # Ensure admin user with Neba / CS3RD exists and is up to date
        admin = db.query(User).filter(
            (User.role == UserRole.admin) | (User.email == settings.ADMIN_EMAIL.lower()) | (User.username == "Neba")
        ).first()

        if not admin:
            admin = User(
                full_name=settings.ADMIN_FULL_NAME,
                username="Neba",
                email=settings.ADMIN_EMAIL.lower(),
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role=UserRole.admin,
                is_active=True,
            )
            db.add(admin)
            db.flush()
            print(f"[SEED] Admin created: username=Neba, email={settings.ADMIN_EMAIL}")
        else:
            # Update admin credentials to Neba / CS3RD
            admin.username = "Neba"
            admin.email = settings.ADMIN_EMAIL.lower()
            admin.full_name = settings.ADMIN_FULL_NAME
            admin.hashed_password = hash_password(settings.ADMIN_PASSWORD)
            admin.role = UserRole.admin
            admin.is_active = True
            db.flush()
            print(f"[SEED] Admin updated: username=Neba, email={settings.ADMIN_EMAIL}, password=CS3RD")

        # Seed academic years if none exist
        if db.query(AcademicYear).count() == 0:
            years_data = [
                {"name": "2nd Year", "order": 1, "is_available": True},
                {"name": "3rd Year", "order": 2, "is_available": True},
                {"name": "4th Year", "order": 3, "is_available": False},
            ]
            semester_map = [
                ("Semester I", 1),
                ("Semester II", 2),
            ]
            for yd in years_data:
                year = AcademicYear(**yd)
                db.add(year)
                db.flush()
                for sem_name, sem_order in semester_map:
                    sem = Semester(
                        name=sem_name,
                        order=sem_order,
                        academic_year_id=year.id,
                    )
                    db.add(sem)
            db.flush()
            print("[SEED] Academic years and semesters created")

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] {e}")
    finally:
        db.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        description="Educational platform for CS students at Wachemo University",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # API routes
    app.include_router(api_router, prefix=settings.API_V1_STR)

    # Health check
    @app.get("/health", tags=["Health"])
    def health():
        return {"status": "ok", "app": settings.APP_NAME}

    return app


app = create_app()
