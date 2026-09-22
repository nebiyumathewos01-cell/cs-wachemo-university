"""
Agentic Material Classifier Agent — Automatically analyzes course files (PDF, DOC, TXT)
and classifies them into the correct Academic Year, Semester, Course, Chapter Number & Title.
"""
import re
import json
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

import google.generativeai as genai
from app.core.config import settings
from app.models.academic import AcademicYear, Semester, Course, Chapter


# Standard CS curriculum reference knowledge for Wachemo University
STANDARD_CS_CURRICULUM = {
    # ─── 2nd Year 1st Semester ──────────────────────────────────
    "Linear Algebra": {
        "year": "2nd Year", "sem": "Semester I",
        "aliases": ["linear algebra", "algebra", "matrix", "matrices", "determinant", "vector space", "eigenvalues", "math201"]
    },
    "Fundamentals of Programming": {
        "year": "2nd Year", "sem": "Semester I",
        "aliases": ["fundamentals of programming", "programming", "c++", "cpp", "coding", "pointers", "arrays", "functions", "cosc201"]
    },
    "Fundamentals of Database Systems": {
        "year": "2nd Year", "sem": "Semester I",
        "aliases": ["fundamentals of database systems", "fundamental database", "database fundamentals", "dbms", "database", "sql", "relational model", "erd", "normalization", "cosc203"]
    },
    "Digital Logic Design": {
        "year": "2nd Year", "sem": "Semester I",
        "aliases": ["digital logic design", "digital logic", "dld", "boolean algebra", "logic gates", "karnaugh", "flip flop", "multiplexer", "cosc205"]
    },
    "Probability and Statistics": {
        "year": "2nd Year", "sem": "Semester I",
        "aliases": ["probability and statistics", "probability", "statistics", "random variables", "distributions", "stat201"]
    },
    "Inclusiveness": {
        "year": "2nd Year", "sem": "Semester I",
        "aliases": ["inclusiveness", "inclusive education", "diversity", "special needs", "snie201"]
    },
    "Introduction to Economics": {
        "year": "2nd Year", "sem": "Semester I",
        "aliases": ["introduction to economics", "economics", "microeconomics", "macroeconomics", "econ201"]
    },

    # ─── 2nd Year 2nd Semester ──────────────────────────────────
    "Data Structures and Algorithms": {
        "year": "2nd Year", "sem": "Semester II",
        "aliases": ["data structures and algorithms", "data structures", "dsa", "algorithms", "stack", "queue", "linked list", "trees", "graphs", "sorting", "searching", "cosc202"]
    },
    "Advanced Database Systems": {
        "year": "2nd Year", "sem": "Semester II",
        "aliases": ["advanced database systems", "advanced database system", "advanced database", "advanced dbms", "query optimization", "nosql", "transactions", "concurrency control", "indexing", "cosc204"]
    },
    "Computer Organization and Architecture": {
        "year": "2nd Year", "sem": "Semester II",
        "aliases": ["computer organization and architecture", "computer organization", "coa", "computer architecture", "instruction set", "cpu design", "memory hierarchy", "cosc206"]
    },
    "Discrete Mathematics": {
        "year": "2nd Year", "sem": "Semester II",
        "aliases": ["discrete mathematics", "discrete maths", "discrete", "propositional logic", "set theory", "relations", "graph theory", "combinatorics", "math202"]
    },
    "Computer Networking": {
        "year": "2nd Year", "sem": "Semester II",
        "aliases": ["computer networking", "computer networks", "networking", "network", "cn", "tcp/ip", "osi model", "routing", "ip address", "lan", "packet", "cosc208"]
    },
    "Object Oriented Programming": {
        "year": "2nd Year", "sem": "Semester II",
        "aliases": ["object oriented programming", "oop", "java", "object oriented", "inheritance", "polymorphism", "encapsulation", "classes", "cosc210"]
    },

    # ─── 3rd Year 1st Semester ──────────────────────────────────
    "Advanced Java Programming": {
        "year": "3rd Year", "sem": "Semester I",
        "aliases": ["advanced java programming", "advanced java", "java programming", "multithreading", "swing", "jdbc", "servlets", "socket programming", "cosc301"]
    },
    "Operating Systems": {
        "year": "3rd Year", "sem": "Semester I",
        "aliases": ["operating systems", "operating system", "os", "process", "thread", "scheduling", "deadlock", "memory management", "virtual memory", "concurrency", "cosc303"]
    },
    "Automata and Complexity Theory": {
        "year": "3rd Year", "sem": "Semester I",
        "aliases": ["automata and complexity theory", "automata and complexity", "automata", "theory of computation", "toc", "turing machine", "cfg", "regular languages", "finite automata", "cosc305"]
    },
    "Global Trends": {
        "year": "3rd Year", "sem": "Semester I",
        "aliases": ["global trends", "globalization", "international relations", "gltr301"]
    },
    "Numerical Analysis": {
        "year": "3rd Year", "sem": "Semester I",
        "aliases": ["numerical analysis", "numerical methods", "interpolation", "root finding", "numerical integration", "math301"]
    },
    "Microprocessing and Assembly Language": {
        "year": "3rd Year", "sem": "Semester I",
        "aliases": ["microprocessing and assembly language", "micro processing and assembly language programming", "microprocessor", "assembly language", "assembly programming", "8086", "addressing modes", "interrupts", "cosc307"]
    },
    "Software Engineering": {
        "year": "3rd Year", "sem": "Semester I",
        "aliases": ["software engineering", "swe", "se", "sdlc", "agile", "scrum", "uml", "software testing", "requirements", "cosc309"]
    },

    # ─── 3rd Year 2nd Semester ──────────────────────────────────
    "Design and Analysis of Algorithms": {
        "year": "3rd Year", "sem": "Semester II",
        "aliases": ["design and analysis of algorithms", "design and analysis of algorithm", "daa", "algorithm analysis", "dynamic programming", "greedy", "divide and conquer", "complexity analysis", "cosc302"]
    },
    "Introduction to Artificial Intelligence": {
        "year": "3rd Year", "sem": "Semester II",
        "aliases": ["introduction to artificial intelligence", "introduction to ai", "artificial intelligence", "ai", "machine learning", "neural network", "expert system", "nlp", "cosc304"]
    },
    "Wireless Communication and Mobile Computing": {
        "year": "3rd Year", "sem": "Semester II",
        "aliases": ["wireless communication and mobile computing", "wireless communication", "mobile computing", "cellular networks", "wi-fi", "mobility management", "mobile networks", "cosc306"]
    },
    "Real-Time and Embedded Systems": {
        "year": "3rd Year", "sem": "Semester II",
        "aliases": ["real-time and embedded systems", "real time and ambedded system", "real time and embedded systems", "embedded systems", "embedded", "microcontrollers", "rtos", "sensors", "cosc308"]
    },
    "Computer Graphics": {
        "year": "3rd Year", "sem": "Semester II",
        "aliases": ["computer graphics", "graphics", "opengl", "rendering", "2d 3d transformation", "rasterization", "shading", "cosc310"]
    },
    "Entrepreneurship and Business Development": {
        "year": "3rd Year", "sem": "Semester II",
        "aliases": ["entrepreneurship and business development", "entrepreneurship", "business development", "mgmt302", "tech startups"]
    },
    "Industrial Practice": {
        "year": "3rd Year", "sem": "Semester II",
        "aliases": ["industrial practice", "industrial practicd", "internship", "field practice", "cosc312"]
    },

    # ─── 4th Year / Exit Exam ───────────────────────────────────
    "Exit Exam Preparation": {
        "year": "4th Year", "sem": "Semester I",
        "aliases": ["exit exam preparation", "exit exam", "national exit exam", "national exam", "exit practice", "comprehensive"]
    },
}


def _heuristic_classify(
    filename: str,
    text_snippet: Optional[str],
    db_years: List[Dict[str, Any]],
    db_courses: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Fast, deterministic fallback classifier based on filename patterns and text inspection."""
    clean_fn = filename.replace("_", " ").replace("-", " ").lower()
    combined_text = f"{clean_fn} {(text_snippet or '')[:2000]}".lower()

    # 1. Detect Chapter Number
    ch_num = 1
    ch_patterns = [
        r"chapter\s*(\d+)",
        r"ch\s*(\d+)",
        r"lecture\s*(\d+)",
        r"lec\s*(\d+)",
        r"unit\s*(\d+)",
        r"part\s*(\d+)",
        r"week\s*(\d+)",
        r"module\s*(\d+)",
    ]
    for pattern in ch_patterns:
        match = re.search(pattern, clean_fn) or (re.search(pattern, combined_text) if text_snippet else None)
        if match:
            try:
                ch_num = int(match.group(1))
                break
            except Exception:
                pass

    # 2. Match Course
    matched_course_name = None
    matched_year = "2nd Year"
    matched_sem = "Semester I"
    best_score = 0

    # First check existing courses from DB
    for c in db_courses:
        c_name = c["name"].lower()
        score = 0
        if re.search(rf"\b{re.escape(c_name)}\b", clean_fn):
            score += 20
        elif c.get("code") and re.search(rf"\b{re.escape(c['code'].lower())}\b", clean_fn):
            score += 15
        elif re.search(rf"\b{re.escape(c_name)}\b", combined_text):
            score += 8
        
        if score > best_score:
            best_score = score
            matched_course_name = c["name"]
            matched_year = c.get("year_name", "2nd Year")
            matched_sem = c.get("semester_name", "Semester I")

    # If DB match is low, check Standard CS Curriculum knowledge base
    if best_score < 8:
        for c_name, meta in STANDARD_CS_CURRICULUM.items():
            for alias in meta["aliases"]:
                # Use word boundary for all aliases
                pattern = rf"\b{re.escape(alias)}\b"
                if re.search(pattern, clean_fn):
                    weight = 15 if len(alias) > 3 else 10
                    if weight > best_score:
                        matched_course_name = c_name
                        matched_year = meta["year"]
                        matched_sem = meta["sem"]
                        best_score = weight
                        break
                elif re.search(pattern, combined_text) and len(alias) > 3:
                    if 6 > best_score:
                        matched_course_name = c_name
                        matched_year = meta["year"]
                        matched_sem = meta["sem"]
                        best_score = 6

    if not matched_course_name:
        matched_course_name = "Computer Science Core"

    # 3. Chapter Title deduction
    # Extract topic after chapter number or from filename
    clean_base = re.sub(r"\.(pdf|docx?|pptx?|txt)$", "", filename, flags=re.IGNORECASE)
    clean_title = clean_base.replace("_", " ").replace("-", " ").strip()
    
    # Try to find a nice chapter title
    ch_title = f"Chapter {ch_num} Introduction"
    topic_match = re.search(r"(?:chapter|ch|lecture|lec)\s*\d+[\s\-_:.]+(.+)", clean_title, re.IGNORECASE)
    if topic_match:
        ch_title = topic_match.group(1).strip()
    else:
        # If filename is descriptive
        parts = clean_title.split()
        if len(parts) > 2:
            ch_title = " ".join(parts[1:]) if len(parts) > 3 else clean_title

    # Capitalize title properly
    ch_title = ch_title.title()
    if not ch_title or len(ch_title) < 3:
        ch_title = f"Chapter {ch_num} Overview"

    return {
        "course_name": matched_course_name,
        "academic_year_name": matched_year,
        "semester_name": matched_sem,
        "chapter_number": ch_num,
        "chapter_title": ch_title,
        "clean_title": clean_title.title(),
        "description": f"Lecture and study material for {matched_course_name} — {ch_title}.",
        "confidence": 0.85 if best_score >= 4 else 0.70,
        "reasoning": f"Matched from filename cues '{filename}' and curriculum reference."
    }


def analyze_material_with_agent(
    filename: str,
    original_filename: str,
    extracted_text: Optional[str],
    db: Session,
    academic_year_id: Optional[int] = None,
    semester_id: Optional[int] = None,
    course_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Main Agent Workflow:
    1. Gather DB context (All existing Academic Years, Semesters, Courses, Chapters).
    2. If Year and Semester hints are provided, scope candidates to that context.
    3. Try Gemini Generative AI for high-accuracy semantic classification.
    4. If Gemini is unavailable or fails, use heuristic classification fallback.
    5. Map result to existing DB record IDs if found.
    """
    # 1. Fetch DB Catalog Context
    years = db.query(AcademicYear).all()
    courses = db.query(Course).all()
    chapters = db.query(Chapter).all()

    years_map = {y.id: y.name for y in years}
    semesters_map = {s.id: s.name for s in db.query(Semester).all()}

    # Resolve locked hints if provided
    hint_year = db.query(AcademicYear).filter(AcademicYear.id == academic_year_id).first() if academic_year_id else None
    hint_sem = db.query(Semester).filter(Semester.id == semester_id).first() if semester_id else None
    hint_course = db.query(Course).filter(Course.id == course_id).first() if course_id else None

    # Filter candidate courses if hints exist
    scoped_courses = courses
    if hint_year:
        scoped_courses = [c for c in scoped_courses if c.academic_year_id == hint_year.id]
    if hint_sem:
        scoped_courses = [c for c in scoped_courses if c.semester_id == hint_sem.id]

    courses_info = []
    for c in scoped_courses:
        courses_info.append({
            "id": c.id,
            "name": c.name,
            "code": c.code,
            "academic_year_id": c.academic_year_id,
            "semester_id": c.semester_id,
            "year_name": years_map.get(c.academic_year_id, "2nd Year"),
            "semester_name": semesters_map.get(c.semester_id, "Semester I"),
        })

    existing_courses_list = [c["name"] for c in courses_info]
    existing_years_list = [y.name for y in years]

    # 2. Fast Deterministic Heuristic Matcher (< 1ms)
    heuristic_data = _heuristic_classify(original_filename, extracted_text, existing_years_list, courses_info)

    # 3. If hint provided, enforce it on heuristic result
    if hint_year:
        heuristic_data["academic_year_name"] = hint_year.name
    if hint_sem:
        heuristic_data["semester_name"] = hint_sem.name
    if hint_course:
        heuristic_data["course_name"] = hint_course.name

    llm_result = None
    # Only invoke Gemini LLM if heuristic confidence is low (< 0.75) and API key exists
    if heuristic_data.get("confidence", 0) < 0.75 and settings.GEMINI_API_KEY:
        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            text_preview = (extracted_text or "")[:1500]
            
            hint_str = ""
            if hint_year:
                hint_str += f"\n- LIKELY ACADEMIC YEAR: {hint_year.name}"
            if hint_sem:
                hint_str += f"\n- LIKELY SEMESTER: {hint_sem.name}"
            if hint_course:
                hint_str += f"\n- LIKELY COURSE: {hint_course.name}"

            prompt = f"""You are an Autonomous AI Academic Registrar for the Computer Science Department at Wachemo University.
Classify this uploaded course file into the curriculum.

FILE DETAILS:
- Original Filename: "{original_filename}"
- Document Text Sample: \"\"\"{text_preview if text_preview.strip() else "No text"}\"\"\"

EXISTING CURRICULUM CONTEXT:
- Available Years: {json.dumps(existing_years_list)}
- Available Courses for this context: {json.dumps(existing_courses_list)}
- Available Semesters: ["Semester I", "Semester II"]{hint_str}

Return ONLY valid JSON in this structure:
{{
  "course_name": "{hint_course.name if hint_course else 'Operating Systems'}",
  "academic_year_name": "{hint_year.name if hint_year else '2nd Year'}",
  "semester_name": "{hint_sem.name if hint_sem else 'Semester II'}",
  "chapter_number": 1,
  "chapter_title": "Introduction",
  "clean_title": "Lecture Notes",
  "description": "Summary",
  "confidence": 0.90,
  "reasoning": "Identified from content"
}}
"""
            response = model.generate_content(prompt)
            raw = response.text.strip()
            raw = re.sub(r"```(?:json)?", "", raw).strip()
            data = json.loads(raw)
            if data.get("course_name") and data.get("chapter_title"):
                llm_result = data
        except Exception as e:
            print(f"[AI AGENT NOTE] Gemini classification fallback used: {e}")
            llm_result = None

    final_data = llm_result or heuristic_data

    # 4. Resolve IDs from DB
    # Year: prioritize hint if provided
    year_obj = hint_year
    if not year_obj:
        for y in years:
            if y.name.lower() in final_data.get("academic_year_name", "").lower() or final_data.get("academic_year_name", "").lower() in y.name.lower():
                year_obj = y
                break
    if not year_obj and years:
        year_obj = years[0]

    # Semester: prioritize hint if provided
    sem_obj = hint_sem
    if not sem_obj and year_obj:
        semesters = db.query(Semester).filter(Semester.academic_year_id == year_obj.id).all()
        for s in semesters:
            if s.name.lower() == final_data.get("semester_name", "").lower():
                sem_obj = s
                break
        if not sem_obj and semesters:
            sem_obj = semesters[0]

    # Course: prioritize hint if provided
    course_obj = hint_course
    if not course_obj:
        c_target = final_data.get("course_name", "").lower()
        for c in scoped_courses:
            if c.name.lower() == c_target or c_target in c.name.lower() or (c.code and c.code.lower() == c_target):
                course_obj = c
                break
        # Fallback check across all courses
        if not course_obj:
            for c in courses:
                if c.name.lower() == c_target or c_target in c.name.lower() or (c.code and c.code.lower() == c_target):
                    course_obj = c
                    break

    # Chapter: Match if course exists
    chapter_obj = None
    ch_num = int(final_data.get("chapter_number", 1))
    if course_obj:
        for ch in chapters:
            if ch.course_id == course_obj.id and ch.number == ch_num:
                chapter_obj = ch
                break

    return {
        "filename": filename,
        "original_filename": original_filename,
        "title": final_data.get("clean_title") or original_filename,
        "description": final_data.get("description", ""),
        "academic_year_name": year_obj.name if year_obj else final_data.get("academic_year_name", "2nd Year"),
        "academic_year_id": year_obj.id if year_obj else None,
        "semester_name": sem_obj.name if sem_obj else final_data.get("semester_name", "Semester I"),
        "semester_id": sem_obj.id if sem_obj else None,
        "course_name": course_obj.name if course_obj else final_data.get("course_name", "Computer Science Core"),
        "course_id": course_obj.id if course_obj else None,
        "chapter_number": ch_num,
        "chapter_title": final_data.get("chapter_title", f"Chapter {ch_num}"),
        "chapter_id": chapter_obj.id if chapter_obj else None,
        "confidence": float(final_data.get("confidence", 0.95 if hint_year else 0.85)),
        "reasoning": final_data.get("reasoning", "Classified automatically by Agentic AI."),
        "is_new_course": course_obj is None,
        "is_new_chapter": chapter_obj is None,
    }

