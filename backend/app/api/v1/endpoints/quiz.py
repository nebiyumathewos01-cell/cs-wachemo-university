"""
Quiz generation, submission, and AI Study Assistant endpoints.
"""
from __future__ import annotations

import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.auth.dependencies import get_current_student, get_current_user
from app.models.question import Question, QuestionOption, Difficulty
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt, StudentAnswer, QuizStatus
from app.models.progress import StudentProgress
from app.models.ai_log import AIGenerationLog
from app.models.user import User
from app.agents.quiz_agent import generate_quiz, answer_study_question
from app.schemas.quiz import (
    GenerateQuizRequest, MockExamRequest, QuizSubmitRequest,
    QuizOut, QuizAttemptOut, QuizResult, AnswerResult,
    QuestionOut, QuestionOptionOut,
    StudyRequest, StudyResponse,
)

router = APIRouter(tags=["Quizzes & AI"])


def _question_to_out(q: Question, include_answer: bool = False) -> QuestionOut:
    options = [
        QuestionOptionOut(
            id=o.id, label=o.label, text=o.text,
            is_correct=o.is_correct if include_answer else False,
        )
        for o in q.options
    ]
    return QuestionOut(
        id=q.id, text=q.text,
        question_type=q.question_type.value,
        difficulty=q.difficulty.value,
        explanation=q.explanation if include_answer else None,
        chapter_id=q.chapter_id,
        course_id=q.course_id,
        options=options,
        created_at=q.created_at.isoformat(),
    )


# ─── Generate Quiz ──────────────────────────────────────────

@router.post("/ai/generate-quiz", response_model=QuizOut, status_code=status.HTTP_201_CREATED)
def api_generate_quiz(
    data: GenerateQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    start_time = time.time()

    validated_questions, gen_status = generate_quiz(
        course_id=data.course_id,
        chapter_id=data.chapter_id,
        num_questions=data.num_questions,
        difficulty=data.difficulty,
        db=db,
    )

    if not validated_questions:
        # Log failure
        log = AIGenerationLog(
            student_id=current_user.id,
            academic_year_id=data.academic_year_id,
            course_id=data.course_id,
            chapter_id=data.chapter_id,
            questions_requested=data.num_questions,
            questions_generated=0,
            questions_validated=0,
            status="failed",
            error_message=gen_status,
            duration_seconds=round(time.time() - start_time, 2),
        )
        db.add(log)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to generate the quiz right now. Please try again.",
        )

    # Persist questions
    quiz_title = f"AI Quiz - Chapter {data.chapter_id} ({data.difficulty.value})"
    quiz = Quiz(
        title=quiz_title,
        chapter_id=data.chapter_id,
        course_id=data.course_id,
        academic_year_id=data.academic_year_id,
        difficulty=data.difficulty,
        question_count=len(validated_questions),
    )
    db.add(quiz)
    db.flush()

    question_outs = []
    for order, q_data in enumerate(validated_questions):
        q = Question(
            text=q_data["text"],
            question_type="mcq",
            difficulty=data.difficulty,
            explanation=q_data.get("explanation"),
            chapter_id=data.chapter_id,
            course_id=data.course_id,
            is_ai_generated=True,
            is_approved=True,
        )
        db.add(q)
        db.flush()

        for opt in q_data["options"]:
            option = QuestionOption(
                question_id=q.id,
                label=opt["label"],
                text=opt["text"],
                is_correct=(opt["label"] == q_data["correct_label"]),
            )
            db.add(option)

        db.flush()
        db.refresh(q)

        qq = QuizQuestion(quiz_id=quiz.id, question_id=q.id, order=order)
        db.add(qq)
        question_outs.append(q)

    # Log success
    log = AIGenerationLog(
        student_id=current_user.id,
        quiz_id=quiz.id,
        academic_year_id=data.academic_year_id,
        course_id=data.course_id,
        chapter_id=data.chapter_id,
        questions_requested=data.num_questions,
        questions_generated=len(validated_questions),
        questions_validated=len(validated_questions),
        status="success",
        duration_seconds=round(time.time() - start_time, 2),
    )
    db.add(log)
    db.commit()
    db.refresh(quiz)

    # Reload with options
    questions_with_opts = []
    for q in question_outs:
        db.refresh(q)
        questions_with_opts.append(_question_to_out(q, include_answer=False))

    return QuizOut(
        id=quiz.id, title=quiz.title,
        chapter_id=quiz.chapter_id, course_id=quiz.course_id,
        academic_year_id=quiz.academic_year_id,
        difficulty=quiz.difficulty.value,
        question_count=quiz.question_count,
        is_mock_exam=quiz.is_mock_exam,
        time_limit_minutes=quiz.time_limit_minutes,
        questions=questions_with_opts,
        created_at=quiz.created_at.isoformat(),
    )


# ─── Start / Get Quiz ────────────────────────────────────────

@router.get("/quizzes/{quiz_id}", response_model=QuizOut)
def get_quiz(quiz_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = []
    for qq in sorted(quiz.quiz_questions, key=lambda x: x.order):
        db.refresh(qq.question)
        questions.append(_question_to_out(qq.question, include_answer=False))

    return QuizOut(
        id=quiz.id, title=quiz.title,
        chapter_id=quiz.chapter_id, course_id=quiz.course_id,
        academic_year_id=quiz.academic_year_id,
        difficulty=quiz.difficulty.value,
        question_count=quiz.question_count,
        is_mock_exam=quiz.is_mock_exam,
        time_limit_minutes=quiz.time_limit_minutes,
        questions=questions,
        created_at=quiz.created_at.isoformat(),
    )


@router.post("/quizzes/{quiz_id}/start", response_model=QuizAttemptOut, status_code=201)
def start_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    attempt = QuizAttempt(
        quiz_id=quiz_id,
        student_id=current_user.id,
        status=QuizStatus.in_progress,
        total_questions=quiz.question_count,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return QuizAttemptOut(
        id=attempt.id, quiz_id=attempt.quiz_id,
        student_id=attempt.student_id, status=attempt.status.value,
        score=attempt.score, total_questions=attempt.total_questions,
        correct_answers=attempt.correct_answers,
        started_at=attempt.started_at.isoformat(),
        completed_at=None,
    )


# ─── Submit Quiz ─────────────────────────────────────────────

@router.post("/quiz-attempts/{attempt_id}/submit", response_model=QuizResult)
def submit_quiz(
    attempt_id: int,
    data: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == attempt_id,
        QuizAttempt.student_id == current_user.id,
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")
    if attempt.status == QuizStatus.completed:
        raise HTTPException(status_code=400, detail="Quiz already submitted")

    # Load the quiz's questions
    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    quiz_question_ids = {qq.question_id for qq in quiz.quiz_questions}

    correct_count = 0
    answer_results = []
    weak_chapter_ids: set[int] = set()

    for ans in data.answers:
        if ans.question_id not in quiz_question_ids:
            continue

        q = db.query(Question).filter(Question.id == ans.question_id).first()
        if not q:
            continue

        # Determine correctness
        is_correct = False
        correct_option = next((o for o in q.options if o.is_correct), None)

        if ans.selected_option_id:
            selected = db.query(QuestionOption).filter(
                QuestionOption.id == ans.selected_option_id,
                QuestionOption.question_id == q.id,
            ).first()
            is_correct = selected.is_correct if selected else False
        elif ans.text_answer:
            # Short answer: basic string match (case-insensitive)
            if correct_option:
                is_correct = ans.text_answer.strip().lower() in correct_option.text.strip().lower()

        if is_correct:
            correct_count += 1
        else:
            if q.chapter_id:
                weak_chapter_ids.add(q.chapter_id)

        # Persist student answer
        student_answer = StudentAnswer(
            attempt_id=attempt_id,
            question_id=ans.question_id,
            selected_option_id=ans.selected_option_id,
            text_answer=ans.text_answer,
            is_correct=is_correct,
        )
        db.add(student_answer)

        answer_results.append(AnswerResult(
            question=_question_to_out(q, include_answer=True),
            selected_option_id=ans.selected_option_id,
            is_correct=is_correct,
            correct_option_id=correct_option.id if correct_option else None,
        ))

    total = attempt.total_questions or len(data.answers)
    score = (correct_count / total * 100) if total > 0 else 0.0

    # Update attempt
    attempt.status = QuizStatus.completed
    attempt.score = score
    attempt.correct_answers = correct_count
    attempt.completed_at = datetime.now(timezone.utc)

    # Update progress
    _update_progress(current_user.id, quiz.course_id, score, db)

    db.commit()

    # Build recommendations
    weak_topics = []
    recommendations = []
    if weak_chapter_ids:
        from app.models.academic import Chapter
        for cid in list(weak_chapter_ids)[:3]:
            ch = db.query(Chapter).filter(Chapter.id == cid).first()
            if ch:
                weak_topics.append(ch.title)
                recommendations.append(f"Review Chapter {ch.number}: {ch.title} and retake the quiz.")
    if not recommendations:
        if score >= 80:
            recommendations.append("Excellent work! Move on to the next chapter.")
        elif score >= 60:
            recommendations.append("Good effort. Review incorrect answers and practice again.")
        else:
            recommendations.append("Review the course material thoroughly and retake the quiz.")

    return QuizResult(
        attempt_id=attempt.id,
        score=score,
        total_questions=total,
        correct_answers=correct_count,
        incorrect_answers=total - correct_count,
        answers=answer_results,
        weak_topics=weak_topics,
        recommendations=recommendations,
    )


def _update_progress(student_id: int, course_id: int, score: float, db: Session) -> None:
    """Update or create a StudentProgress record after a quiz submission."""
    progress = db.query(StudentProgress).filter(
        StudentProgress.student_id == student_id,
        StudentProgress.course_id == course_id,
    ).first()

    if not progress:
        progress = StudentProgress(
            student_id=student_id,
            course_id=course_id,
            quiz_attempts_count=1,
            average_score=score,
        )
        db.add(progress)
    else:
        n = progress.quiz_attempts_count
        progress.average_score = (progress.average_score * n + score) / (n + 1)
        progress.quiz_attempts_count = n + 1
        progress.last_activity = datetime.now(timezone.utc)


# ─── AI Study Assistant ──────────────────────────────────────

@router.post("/ai/study", response_model=StudyResponse)
def ai_study(
    data: StudyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_student),
):
    answer = answer_study_question(
        course_id=data.course_id,
        chapter_id=data.chapter_id,
        question=data.question,
        db=db,
    )
    return StudyResponse(answer=answer, sources=[])
