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

        # Seed academic years and official Wachemo CS curriculum if needed
        years_map_db = {}
        for y_data in [
            {"name": "2nd Year", "order": 1, "is_available": True},
            {"name": "3rd Year", "order": 2, "is_available": True},
            {"name": "4th Year", "order": 3, "is_available": False},
        ]:
            y_obj = db.query(AcademicYear).filter(AcademicYear.name == y_data["name"]).first()
            if not y_obj:
                y_obj = AcademicYear(**y_data)
                db.add(y_obj)
                db.flush()
            years_map_db[y_data["name"]] = y_obj

        # Ensure Semesters exist
        sem_map_db = {}
        for y_name, y_obj in years_map_db.items():
            for s_name, s_order in [("Semester I", 1), ("Semester II", 2)]:
                s_obj = db.query(Semester).filter(
                    Semester.academic_year_id == y_obj.id,
                    Semester.name == s_name
                ).first()
                if not s_obj:
                    s_obj = Semester(name=s_name, order=s_order, academic_year_id=y_obj.id)
                    db.add(s_obj)
                    db.flush()
                sem_map_db[f"{y_name}_{s_name}"] = s_obj

        # Official Wachemo CS Curriculum Courses
        wachemo_courses = [
            # 2nd Year - 1st Semester
            {"name": "Linear Algebra", "code": "MATH201", "year": "2nd Year", "sem": "Semester I", "desc": "Systems of linear equations, matrices, determinants, vector spaces, and eigenvalues."},
            {"name": "Fundamentals of Programming", "code": "COSC201", "year": "2nd Year", "sem": "Semester I", "desc": "C++ programming fundamentals, control structures, functions, arrays, and pointers."},
            {"name": "Fundamentals of Database Systems", "code": "COSC203", "year": "2nd Year", "sem": "Semester I", "desc": "Relational data model, SQL, entity-relationship modeling, and normalization."},
            {"name": "Digital Logic Design", "code": "COSC205", "year": "2nd Year", "sem": "Semester I", "desc": "Boolean algebra, combinational circuits, sequential circuits, registers, and counters."},
            {"name": "Probability and Statistics", "code": "STAT201", "year": "2nd Year", "sem": "Semester I", "desc": "Probability theory, random variables, statistical distributions, and hypothesis testing."},
            {"name": "Inclusiveness", "code": "SNIE201", "year": "2nd Year", "sem": "Semester I", "desc": "Inclusive education principles, diversity, and accessibility in higher education."},
            {"name": "Introduction to Economics", "code": "ECON201", "year": "2nd Year", "sem": "Semester I", "desc": "Microeconomics and macroeconomics concepts and principles for technology."},

            # 2nd Year - 2nd Semester
            {"name": "Data Structures and Algorithms", "code": "COSC202", "year": "2nd Year", "sem": "Semester II", "desc": "Stacks, queues, linked lists, trees, graphs, sorting, and searching algorithms."},
            {"name": "Advanced Database Systems", "code": "COSC204", "year": "2nd Year", "sem": "Semester II", "desc": "Query optimization, transaction management, concurrency control, NoSQL, and indexing."},
            {"name": "Computer Organization and Architecture", "code": "COSC206", "year": "2nd Year", "sem": "Semester II", "desc": "Instruction set architecture, CPU design, memory hierarchy, and I/O systems."},
            {"name": "Discrete Mathematics", "code": "MATH202", "year": "2nd Year", "sem": "Semester II", "desc": "Propositional logic, set theory, functions, relations, graphs, and trees."},
            {"name": "Computer Networking", "code": "COSC208", "year": "2nd Year", "sem": "Semester II", "desc": "OSI & TCP/IP models, network protocols, routing, switching, IP addressing, and LANs."},
            {"name": "Object Oriented Programming", "code": "COSC210", "year": "2nd Year", "sem": "Semester II", "desc": "OOP paradigms in Java, classes, inheritance, polymorphism, encapsulation, and exceptions."},

            # 3rd Year - 1st Semester
            {"name": "Advanced Java Programming", "code": "COSC301", "year": "3rd Year", "sem": "Semester I", "desc": "Java GUI, multithreading, socket programming, JDBC database connectivity, and Java EE."},
            {"name": "Operating Systems", "code": "COSC303", "year": "3rd Year", "sem": "Semester I", "desc": "Process management, CPU scheduling, synchronization, deadlocks, and virtual memory."},
            {"name": "Automata and Complexity Theory", "code": "COSC305", "year": "3rd Year", "sem": "Semester I", "desc": "Finite automata, regular languages, context-free grammars, Turing machines, and P vs NP."},
            {"name": "Global Trends", "code": "GLTR301", "year": "3rd Year", "sem": "Semester I", "desc": "Contemporary global issues, international relations, and socioeconomic developments."},
            {"name": "Numerical Analysis", "code": "MATH301", "year": "3rd Year", "sem": "Semester I", "desc": "Root-finding algorithms, numerical linear algebra, interpolation, and numerical calculus."},
            {"name": "Microprocessing and Assembly Language", "code": "COSC307", "year": "3rd Year", "sem": "Semester I", "desc": "8086 microprocessor architecture, assembly programming, addressing modes, and interrupts."},
            {"name": "Software Engineering", "code": "COSC309", "year": "3rd Year", "sem": "Semester I", "desc": "SDLC methodologies, Agile, requirements analysis, UML modeling, and software testing."},

            # 3rd Year - 2nd Semester
            {"name": "Design and Analysis of Algorithms", "code": "COSC302", "year": "3rd Year", "sem": "Semester II", "desc": "Algorithm design paradigms, greedy techniques, divide & conquer, and dynamic programming."},
            {"name": "Introduction to Artificial Intelligence", "code": "COSC304", "year": "3rd Year", "sem": "Semester II", "desc": "Search algorithms, knowledge representation, expert systems, neural networks, and NLP."},
            {"name": "Wireless Communication and Mobile Computing", "code": "COSC306", "year": "3rd Year", "sem": "Semester II", "desc": "Wireless transmission, cellular architectures, Wi-Fi, mobility management, and mobile apps."},
            {"name": "Real-Time and Embedded Systems", "code": "COSC308", "year": "3rd Year", "sem": "Semester II", "desc": "Embedded hardware architectures, microcontroller programming, sensors, and RTOS."},
            {"name": "Computer Graphics", "code": "COSC310", "year": "3rd Year", "sem": "Semester II", "desc": "2D/3D transformations, rasterization, clipping, lighting, OpenGL, and rendering."},
            {"name": "Entrepreneurship and Business Development", "code": "MGMT302", "year": "3rd Year", "sem": "Semester II", "desc": "Innovation, business planning, tech startups, marketing, and venture financing."},
            {"name": "Industrial Practice", "code": "COSC312", "year": "3rd Year", "sem": "Semester II", "desc": "Practical industry internship and real-world software engineering practice."},
        ]

        from app.models.academic import Course
        for c_info in wachemo_courses:
            y_obj = years_map_db.get(c_info["year"])
            s_obj = sem_map_db.get(f"{c_info['year']}_{c_info['sem']}")
            if y_obj and s_obj:
                existing_c = db.query(Course).filter(
                    (Course.name == c_info["name"]) | (Course.code == c_info["code"])
                ).first()
                if not existing_c:
                    c_record = Course(
                        name=c_info["name"],
                        code=c_info["code"],
                        description=c_info["desc"],
                        academic_year_id=y_obj.id,
                        semester_id=s_obj.id,
                    )
                    db.add(c_record)
                else:
                    # Update year and semester link to ensure 100% correct placement
                    existing_c.academic_year_id = y_obj.id
                    existing_c.semester_id = s_obj.id

        db.commit()
        print("[SEED] Wachemo CS curriculum courses seeded and synced successfully")
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
    origins = settings.allowed_origins_list
    if "*" in origins or not origins:
        origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|http://localhost:.*|http://127\.0\.0\.1:.*",
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
