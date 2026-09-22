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


# Standard CS curriculum reference knowledge for Wachemo University / Ethiopian Higher Education CS Curriculums
STANDARD_CS_CURRICULUM = {
    # 2nd Year Semester I
    "Object Oriented Programming": {"year": "2nd Year", "sem": "Semester I", "aliases": ["object oriented programming", "oop", "java", "c++", "object oriented"]},
    "Data Structures and Algorithms": {"year": "2nd Year", "sem": "Semester I", "aliases": ["data structures and algorithms", "data structures", "dsa", "algorithms", "stack", "queue", "tree", "graph"]},
    "Computer Organization and Architecture": {"year": "2nd Year", "sem": "Semester I", "aliases": ["computer organization and architecture", "computer organization", "coa", "microprocessor", "assembly", "cpu architecture"]},
    "Discrete Mathematics": {"year": "2nd Year", "sem": "Semester I", "aliases": ["discrete mathematics", "discrete", "logic", "set theory", "combinatorics"]},

    # 2nd Year Semester II
    "Operating Systems": {"year": "2nd Year", "sem": "Semester II", "aliases": ["operating systems", "operating system", "os", "process", "thread", "scheduling", "deadlock", "memory management", "concurrency"]},
    "Database Systems": {"year": "2nd Year", "sem": "Semester II", "aliases": ["database systems", "database system", "dbms", "database", "sql", "relational", "erd", "normalization", "nosql"]},
    "Design and Analysis of Algorithms": {"year": "2nd Year", "sem": "Semester II", "aliases": ["design and analysis of algorithms", "daa", "algorithm analysis", "dynamic programming", "greedy", "divide and conquer"]},
    "Web Programming": {"year": "2nd Year", "sem": "Semester II", "aliases": ["web programming", "web development", "web", "html", "css", "javascript", "react", "php", "full stack", "backend", "frontend"]},

    # 3rd Year Semester I
    "Software Engineering": {"year": "3rd Year", "sem": "Semester I", "aliases": ["software engineering", "swe", "se", "sdlc", "agile", "scrum", "uml", "software testing"]},
    "Computer Networks": {"year": "3rd Year", "sem": "Semester I", "aliases": ["computer networks", "computer network", "networks", "networking", "network", "cn", "tcp/ip", "osi model", "routing", "ip address", "lan", "packet"]},
    "Theory of Computation": {"year": "3rd Year", "sem": "Semester I", "aliases": ["theory of computation", "automata theory", "toc", "automata", "turing machine", "cfg", "regular expression", "formal languages"]},
    "Mobile Application Development": {"year": "3rd Year", "sem": "Semester I", "aliases": ["mobile application development", "mobile app", "mobile", "android", "flutter", "react native", "ios", "kotlin"]},

    # 3rd Year Semester II
    "Artificial Intelligence": {"year": "3rd Year", "sem": "Semester II", "aliases": ["artificial intelligence", "ai", "machine learning", "neural network", "deep learning", "expert system", "nlp"]},
    "Computer Security and Cryptography": {"year": "3rd Year", "sem": "Semester II", "aliases": ["computer security and cryptography", "computer security", "cyber security", "security", "cryptography", "encryption", "rsa", "firewall", "network security"]},
    "Compiler Design": {"year": "3rd Year", "sem": "Semester II", "aliases": ["compiler design", "compiler", "parsing", "lexical analysis", "syntax tree", "code generation", "lexer"]},
    "Distributed Systems": {"year": "3rd Year", "sem": "Semester II", "aliases": ["distributed systems", "distributed system", "distributed", "cloud computing", "rpc", "microservices", "consensus"]},

    # 4th Year / Exit Exam
    "Exit Exam Preparation": {"year": "4th Year", "sem": "Semester I", "aliases": ["exit exam preparation", "exit exam", "national exit exam", "national exam", "exit practice", "comprehensive"]},
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
) -> Dict[str, Any]:
    """
    Main Agent Workflow:
    1. Gather DB context (All existing Academic Years, Semesters, Courses, Chapters).
    2. Try Gemini Generative AI for high-accuracy semantic classification.
    3. If Gemini is unavailable or fails, use heuristic classification fallback.
    4. Map result to existing DB record IDs if found.
    """
    # 1. Fetch DB Catalog Context
    years = db.query(AcademicYear).all()
    courses = db.query(Course).all()
    chapters = db.query(Chapter).all()

    years_map = {y.id: y.name for y in years}
    courses_info = []
    for c in courses:
        courses_info.append({
            "id": c.id,
            "name": c.name,
            "code": c.code,
            "academic_year_id": c.academic_year_id,
            "semester_id": c.semester_id,
            "year_name": years_map.get(c.academic_year_id, "2nd Year"),
        })

    existing_courses_list = [c["name"] for c in courses_info]
    existing_years_list = [y.name for y in years]

    # 2. Try Gemini AI LLM Analysis
    llm_result = None
    if settings.GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            text_preview = (extracted_text or "")[:3500]
            
            prompt = f"""You are an Autonomous AI Academic Registrar for the Computer Science Department at Wachemo University.
Your task is to analyze the uploaded course file and classify where it belongs in the curriculum.

FILE DETAILS:
- Original Filename: "{original_filename}"
- Document Text Sample (first few pages/slides):
\"\"\"{text_preview if text_preview.strip() else "No extracted text (use filename and CS knowledge)"}\"\"\"

EXISTING CURRICULUM CONTEXT:
- Available Years: {json.dumps(existing_years_list)}
- Available Courses: {json.dumps(existing_courses_list)}
- Available Semesters: ["Semester I", "Semester II"]

INSTRUCTIONS:
1. Identify the Course (e.g., "Operating Systems", "Data Structures and Algorithms", "Computer Networks", "Database Systems", "Software Engineering", "Artificial Intelligence", etc.). If it closely matches an existing course name, use that exact name.
2. Identify the Academic Year ("2nd Year", "3rd Year", or "4th Year").
3. Identify the Semester ("Semester I" or "Semester II").
4. Identify the Chapter Number (integer, e.g. 1, 2, 3, 4, 5, 6...).
5. Identify a clear, concise Chapter Title (e.g., "Process Management", "Binary Trees & BST", "Network Layer & IP Addressing").
6. Provide a Clean Material Title (e.g., "Chapter 1 - Introduction to Operating Systems Slides").
7. Provide a 1-sentence Description summary.
8. Provide a confidence score between 0.0 and 1.0.
9. Provide a brief 1-sentence reasoning.

RETURN FORMAT: Return ONLY valid JSON in this exact structure, with no markdown codeblocks:
{{
  "course_name": "Operating Systems",
  "academic_year_name": "2nd Year",
  "semester_name": "Semester II",
  "chapter_number": 2,
  "chapter_title": "Process Management and CPU Scheduling",
  "clean_title": "Chapter 2 - Processes and Scheduling Slides",
  "description": "Comprehensive slides covering process control blocks, context switching, and CPU scheduling algorithms.",
  "confidence": 0.96,
  "reasoning": "Identified PCB, CPU scheduling diagrams, and OS header from Chapter 2 lecture material."
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

    # 3. Use Heuristic fallback if LLM failed
    final_data = llm_result or _heuristic_classify(original_filename, extracted_text, existing_years_list, courses_info)

    # 4. Resolve IDs from DB
    # Match Year
    year_obj = None
    for y in years:
        if y.name.lower() in final_data.get("academic_year_name", "").lower() or final_data.get("academic_year_name", "").lower() in y.name.lower():
            year_obj = y
            break
    if not year_obj and years:
        year_obj = years[0]

    # Match Semester
    sem_obj = None
    if year_obj:
        semesters = db.query(Semester).filter(Semester.academic_year_id == year_obj.id).all()
        for s in semesters:
            if s.name.lower() == final_data.get("semester_name", "").lower():
                sem_obj = s
                break
        if not sem_obj and semesters:
            sem_obj = semesters[0]

    # Match Course
    course_obj = None
    c_target = final_data.get("course_name", "").lower()
    for c in courses:
        if c.name.lower() == c_target or c_target in c.name.lower() or (c.code and c.code.lower() == c_target):
            course_obj = c
            break

    # Match Chapter if course exists
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
        "confidence": float(final_data.get("confidence", 0.9)),
        "reasoning": final_data.get("reasoning", "Classified automatically by Agentic AI."),
        "is_new_course": course_obj is None,
        "is_new_chapter": chapter_obj is None,
    }
