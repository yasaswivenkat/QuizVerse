from typing import List
from fastapi import APIRouter, HTTPException, Query
from app.models import ClientQuestion, AnswerSubmission, EvaluationResult
from app.database import (
    get_questions, get_question_by_id,
    get_all_categories_from_db, record_question_answer_stat
)
from app.config import (
    MODES, XP_PER_CORRECT_ANSWER,
    XP_STREAK_BONUS_MULTIPLIER, XP_SPEED_BONUS_MAX
)

router = APIRouter(prefix="/api/quiz", tags=["Quiz"])

@router.get("/categories")
def list_categories():
    categories = get_all_categories_from_db()
    return {"categories": categories, "modes": MODES}

@router.get("/questions", response_model=List[ClientQuestion])
def fetch_quiz_questions(
    category: str = Query("all"),
    difficulty: str = Query("all"),
    mode: str = Query("classic"),
    limit: int = Query(10, ge=1, le=50)
):
    raw_questions = get_questions(
        category=category,
        difficulty=difficulty,
        limit=limit,
        shuffle=True
    )
    client_questions = []
    for q in raw_questions:
        client_questions.append(ClientQuestion(
            id=q["id"],
            category=q["category"],
            difficulty=q["difficulty"],
            type=q["type"],
            question=q["question"],
            options=q["options"],
            has_code=bool(q.get("code_snippet")),
            code_snippet=q.get("code_snippet"),
            time_limit_sec=q.get("time_limit_sec", 20)
        ))
    return client_questions

@router.post("/evaluate", response_model=EvaluationResult)
def evaluate_answer(submission: AnswerSubmission):
    q = get_question_by_id(submission.question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    is_correct = (submission.selected_index == q["answer_index"])
    correct_idx = q["answer_index"]
    correct_str = q["options"][correct_idx] if 0 <= correct_idx < len(q["options"]) else ""

    record_question_answer_stat(q["id"], is_correct)

    score_delta = 0
    xp_earned = 0
    streak = submission.streak
    streak_multiplier = 1.0
    speed_bonus = 0

    if is_correct:
        streak += 1
        streak_multiplier = round(1.0 + (streak * 0.1), 2)
        difficulty_weights = {"easy": 100, "medium": 150, "hard": 220}
        base_score = difficulty_weights.get(q["difficulty"], 100)

        max_time = float(q.get("time_limit_sec", 20))
        time_spent = max(0.5, submission.time_spent_seconds)
        time_ratio = max(0.0, 1.0 - (time_spent / max_time))
        speed_bonus = int(round(time_ratio * XP_SPEED_BONUS_MAX))
        score_delta = int(round((base_score + speed_bonus) * streak_multiplier))

        streak_xp = streak * XP_STREAK_BONUS_MULTIPLIER
        xp_earned = XP_PER_CORRECT_ANSWER + speed_bonus + streak_xp

        if submission.lifelines_used:
            xp_earned = max(40, int(xp_earned * (0.85 ** len(submission.lifelines_used))))
    else:
        streak = 0
        streak_multiplier = 1.0
        score_delta = 0
        xp_earned = 10

    return EvaluationResult(
        question_id=q["id"],
        is_correct=is_correct,
        correct_index=correct_idx,
        correct_answer=correct_str,
        explanation=q["explanation"],
        score_delta=score_delta,
        xp_earned=xp_earned,
        streak=streak,
        streak_multiplier=streak_multiplier,
        speed_bonus=speed_bonus,
        fun_fact=f"Did you know? {q['explanation'].split('.')[0]}."
    )
