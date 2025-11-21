from fastapi import APIRouter, HTTPException
import uuid
import json
from typing import Dict, Any, List
from app.models import CustomQuizCreate
from app.database import save_custom_quiz, get_custom_quiz, get_connection

router = APIRouter(prefix="/api/custom-quiz", tags=["Custom Quiz Studio"])

@router.post("")
def create_new_custom_quiz(payload: CustomQuizCreate):
    for idx, q in enumerate(payload.questions):
        if q.answer_index < 0 or q.answer_index >= len(q.options):
            raise HTTPException(
                status_code=400,
                detail=f"Question #{idx+1} has invalid answer index {q.answer_index}. Must be between 0 and {len(q.options)-1}"
            )

    quiz_id = f"QZ-{uuid.uuid4().hex[:6].upper()}"

    formatted_questions = []
    for idx, q in enumerate(payload.questions):
        formatted_questions.append({
            "id": f"{quiz_id}-{idx+1}",
            "question": q.question,
            "options": q.options,
            "answer_index": q.answer_index,
            "explanation": q.explanation,
            "difficulty": q.difficulty,
            "code_snippet": q.code_snippet,
            "time_limit_sec": payload.time_per_question
        })

    quiz_dict = {
        "title": payload.title,
        "description": payload.description,
        "category": payload.category,
        "creator_name": payload.creator_name,
        "time_per_question": payload.time_per_question,
        "questions": formatted_questions
    }

    save_custom_quiz(quiz_id, quiz_dict)

    return {
        "status": "created",
        "quiz_id": quiz_id,
        "share_code": quiz_id,
        "question_count": len(payload.questions),
        "message": f"Quiz successfully published! Share Code: {quiz_id}"
    }

@router.get("/{quiz_id}")
def fetch_custom_quiz(quiz_id: str):
    data = get_custom_quiz(quiz_id.upper())
    if not data:
        raise HTTPException(status_code=404, detail="Custom quiz not found with this code")

    client_questions = []
    for q in data["questions"]:
        client_questions.append({
            "id": q["id"],
            "category": data.get("category", "custom"),
            "difficulty": q.get("difficulty", "medium"),
            "type": "code" if q.get("code_snippet") else "single",
            "question": q["question"],
            "options": q["options"],
            "has_code": bool(q.get("code_snippet")),
            "code_snippet": q.get("code_snippet"),
            "time_limit_sec": data.get("time_per_question", 25)
        })

    return {
        "id": data["id"],
        "title": data["title"],
        "description": data["description"],
        "creator_name": data["creator_name"],
        "time_per_question": data["time_per_question"],
        "questions": client_questions
    }

@router.get("")
def list_custom_quizzes():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, title, description, category, creator_name, time_per_question, questions_json, created_at
    FROM custom_quizzes ORDER BY created_at DESC LIMIT 20
    """)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        q_list = json.loads(r["questions_json"])
        result.append({
            "id": r["id"],
            "title": r["title"],
            "description": r["description"],
            "category": r["category"],
            "creator_name": r["creator_name"],
            "time_per_question": r["time_per_question"],
            "question_count": len(q_list),
            "created_at": r["created_at"]
        })
    return result
