# Computer Science Wachemo University — Learning Platform

A modern, production-ready educational platform for Computer Science students at Wachemo University.

**Developed by:** Nebiyu Mathewos

---

## What This Platform Does

One organized place for CS students to:

- Browse **course materials** organized by year, semester, and chapter
- Take **AI-generated quizzes** grounded in uploaded course content
- Download and read **past exam papers**
- Simulate exams with **timed mock exams**
- Get explanations from the **AI Study Assistant**
- Track **progress**, weak topics, and scores
- Bookmark courses, chapters, materials, and questions

---

## Academic Content

| Year     | Status       |
|----------|-------------|
| 2nd Year | ✅ Available |
| 3rd Year | ✅ Available |
| 4th Year | 🔜 Coming Soon |
| Exit Exam | 🔜 Coming Soon |

---

## Technology Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, Axios, React Hook Form, Zod |
| Backend   | Python, FastAPI, SQLAlchemy, Alembic, Pydantic  |
| Database  | PostgreSQL                                      |
| AI        | Google Gemini API (backend-only, never exposed to frontend) |
| Auth      | JWT, bcrypt password hashing                    |
| File Storage | Local filesystem (dev), S3/Cloudinary-ready  |

---

## Project Structure

```
Neba CS/
├── frontend/          # React + Vite + TypeScript
│   ├── src/
│   │   ├── api/           # Axios API clients
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # AuthContext
│   │   ├── features/      # Feature modules (quiz, courses, ai, progress)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── layouts/       # StudentLayout, AdminLayout
│   │   ├── pages/         # Route pages
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Helper utilities
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── backend/           # FastAPI + Python
    ├── app/
    │   ├── api/v1/endpoints/  # REST API routes
    │   ├── agents/            # Agentic AI (Gemini quiz generator)
    │   ├── auth/              # JWT dependencies
    │   ├── core/              # Config, database, security
    │   ├── models/            # SQLAlchemy ORM models
    │   ├── schemas/           # Pydantic schemas
    │   └── utils/             # File handling utilities
    ├── alembic/               # Database migrations
    ├── uploads/               # Uploaded files (gitignored)
    ├── requirements.txt
    └── .env
```

---

## Prerequisites

Before you start, make sure you have:

- **Node.js** v18+ (download: https://nodejs.org)
- **Python** 3.11+ (download: https://python.org)
- **PostgreSQL** 15+ (download: https://postgresql.org)
- A **Google Gemini API key** (get one free: https://aistudio.google.com)

---

## Setup Instructions

### Step 1 — Create the PostgreSQL database

Open pgAdmin or psql and run:

```sql
CREATE DATABASE cs_wachemo;
```

---

### Step 2 — Configure the backend

```powershell
cd "c:\Users\HP\Neba CS\backend"
```

Copy the example env file and edit it:

```powershell
Copy-Item .env.example .env
```

Open `.env` and update these values:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/cs_wachemo
SECRET_KEY=your-long-random-secret-key-here
GEMINI_API_KEY=your-gemini-api-key-here
ADMIN_EMAIL=admin@wachemo.edu.et
ADMIN_PASSWORD=YourSecureAdminPassword
```

Generate a strong SECRET_KEY with:
```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

---

### Step 3 — Install backend dependencies

```powershell
cd "c:\Users\HP\Neba CS\backend"

# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

---

### Step 4 — Run database migrations

With the virtual environment active and PostgreSQL running:

```powershell
cd "c:\Users\HP\Neba CS\backend"
venv\Scripts\activate

alembic upgrade head
```

This creates all database tables. The app will also seed:
- Admin user (from `.env` ADMIN_EMAIL / ADMIN_PASSWORD)
- Academic years: 2nd Year, 3rd Year, 4th Year (coming soon)
- Semesters I and II for each year

---

### Step 5 — Start the backend

```powershell
cd "c:\Users\HP\Neba CS\backend"
venv\Scripts\activate

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify it's running: http://localhost:8000/health
API docs: http://localhost:8000/docs

---

### Step 6 — Install frontend dependencies

Open a **new terminal**:

```powershell
cd "c:\Users\HP\Neba CS\frontend"
npm install
```

---

### Step 7 — Start the frontend

```powershell
cd "c:\Users\HP\Neba CS\frontend"
npm run dev
```

Open the app: http://localhost:5173

---

## Default Admin Credentials

After running migrations, log in at http://localhost:5173/login with:

```
Email:    admin@wachemo.edu.et
Password: AdminPass123!
```

(Change these in `backend/.env` before deploying)

---

## Development Workflow

### Adding course content (Admin Panel)

1. Log in as admin → http://localhost:5173/admin
2. Go to **Courses** → create a course (assign to 2nd Year, Semester I)
3. Go to **Chapters** → add chapters to the course
4. Go to **Materials** → upload PDF notes for each chapter
5. Students can now browse, read, and generate AI quizzes from that content

### AI Quiz generation

The AI agent workflow:
1. Student selects: Year → Semester → Course → Chapter → difficulty
2. Backend retrieves uploaded material text for that chapter
3. Gemini generates questions grounded in the actual uploaded content
4. Questions are validated and returned to the student

**The Gemini API key is backend-only. The frontend never touches it.**

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | required |
| `SECRET_KEY` | JWT signing key (keep secret!) | required |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime (7 days) | `10080` |
| `GEMINI_API_KEY` | Google Gemini API key | required for AI |
| `UPLOAD_DIR` | Directory for uploaded files | `uploads` |
| `MAX_FILE_SIZE_MB` | Maximum upload file size | `50` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173` |
| `ADMIN_EMAIL` | Seeded admin email | `admin@wachemo.edu.et` |
| `ADMIN_PASSWORD` | Seeded admin password | `AdminPass123!` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api/v1` |

---

## API Documentation

With the backend running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key Endpoints

```
POST /api/v1/auth/register        Register a student
POST /api/v1/auth/login           Login (returns JWT)
GET  /api/v1/auth/me              Get current user

GET  /api/v1/academic-years       List years (2nd, 3rd, 4th)
GET  /api/v1/academic-years/{id}/semesters

GET  /api/v1/courses              List courses (filter by year/semester)
GET  /api/v1/courses/{id}/chapters
GET  /api/v1/chapters/{id}/materials

POST /api/v1/ai/generate-quiz     Generate AI quiz from chapter material
POST /api/v1/quiz-attempts/{id}/submit
POST /api/v1/ai/study             AI Study Assistant

GET  /api/v1/past-exams           Browse past exams
GET  /api/v1/progress             Student progress summary
```

---

## Database Migration Commands

```powershell
# Apply all pending migrations
alembic upgrade head

# Check current migration version
alembic current

# Create a new migration after changing models
alembic revision --autogenerate -m "add something"

# Roll back one migration
alembic downgrade -1
```

---

## Development Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Project setup, structure, auth scaffold | ✅ Complete |
| 2 | Authentication — register, login, JWT, roles | Next |
| 3 | Academic structure — years, semesters, courses | Planned |
| 4 | Admin content management | Planned |
| 5 | Student dashboard + course browsing | Planned |
| 6 | Materials + past exams | Planned |
| 7 | Agentic AI quiz generator | Planned |
| 8 | Quiz system — MCQ, T/F, submission, results | Planned |
| 9 | Mock exams with timer | Planned |
| 10 | Progress tracking + recommendations | Planned |
| 11 | AI Study Assistant | Planned |
| 12 | Exit Exam coming-soon page | Planned |
| 13 | Responsive optimization | Planned |
| 14 | Testing + deployment | Planned |

---

**`psycopg2-binary>=2.9.10`** is required (2.9.10+ has Python 3.13 wheels).  
**`sqlalchemy>=2.0.36`** is required (earlier versions break with Python 3.13).

> The project's `requirements.txt` already has the correct pinned versions.

**Backend won't start — "cannot connect to database"**
- Make sure PostgreSQL is running
- Check `DATABASE_URL` in `backend/.env`
- Confirm the database `cs_wachemo` exists

**`alembic upgrade head` fails with "relation already exists"**
- The tables were created by a previous run. Run:
  ```powershell
  alembic stamp head
  ```

**Frontend shows "Network Error"**
- Make sure the backend is running on port 8000
- Check `VITE_API_BASE_URL` in `frontend/.env`
- Check that CORS `ALLOWED_ORIGINS` includes `http://localhost:5173`

**AI quiz returns "Unable to generate"**
- Set `GEMINI_API_KEY` in `backend/.env`
- Make sure the chapter has uploaded materials with extractable text

---

## Security Notes

- Never commit `.env` files (they are gitignored)
- Change `SECRET_KEY` and `ADMIN_PASSWORD` before any deployment
- The Gemini API key is backend-only — it never reaches the browser
- All file uploads are validated (type + size) before saving
- Passwords are hashed with bcrypt before storage
- All database queries use SQLAlchemy parameterized statements

---

## License

Built for Wachemo University Computer Science Department.

**Developed by Nebiyu Mathewos**
