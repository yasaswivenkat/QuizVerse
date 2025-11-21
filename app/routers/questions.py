from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel, Field
from app.database import (
    create_question_in_db, update_question_in_db, delete_question_from_db,
    get_question_by_id, get_connection
)
import json

router = APIRouter(prefix="/api/questions", tags=["Questions (Dynamic CRUD)"])

class QuestionCreateInput(BaseModel):
    category: str
    difficulty: str = "medium"
    type: str = "single"
    question: str = Field(..., min_length=5)
    options: List[str] = Field(..., min_length=2, max_length=4)
    answer_index: int
    explanation: str = Field(..., min_length=5)
    code_snippet: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    time_limit_sec: int = Field(20, ge=10, le=60)

class QuestionUpdateInput(BaseModel):
    category: str
    difficulty: str = "medium"
    type: str = "single"
    question: str
    options: List[str]
    answer_index: int
    explanation: str
    code_snippet: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    time_limit_sec: int = 20

@router.get("")
def browse_questions(
    search: Optional[str] = None,
    category: Optional[str] = "all",
    difficulty: Optional[str] = "all",
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM questions WHERE 1=1"
    params = []

    if category and category != "all":
        query += " AND category = ?"
        params.append(category)

    if difficulty and difficulty != "all":
        query += " AND difficulty = ?"
        params.append(difficulty)

    if search:
        query += " AND (question LIKE ? OR explanation LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()

    cursor.execute("SELECT COUNT(*) FROM questions")
    total_count = cursor.fetchone()[0]
    conn.close()

    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "category": r["category"],
            "difficulty": r["difficulty"],
            "type": r["type"],
            "question": r["question"],
            "options": json.loads(r["options_json"]),
            "answer_index": r["answer_index"],
            "explanation": r["explanation"],
            "code_snippet": r["code_snippet"],
            "tags": json.loads(r["tags_json"]),
            "time_limit_sec": r["time_limit_sec"],
            "times_answered": r["times_answered"],
            "times_correct": r["times_correct"],
            "created_at": r["created_at"]
        })

    return {"total": total_count, "items": result}

@router.post("")
def add_new_question(payload: QuestionCreateInput):
    if payload.answer_index < 0 or payload.answer_index >= len(payload.options):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid answer_index {payload.answer_index} for {len(payload.options)} options."
        )

    created = create_question_in_db(payload.model_dump())
    return created

@router.put("/{question_id}")
def edit_question(question_id: str, payload: QuestionUpdateInput):
    if payload.answer_index < 0 or payload.answer_index >= len(payload.options):
        raise HTTPException(status_code=400, detail="Invalid answer_index.")

    updated = update_question_in_db(question_id, payload.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Question not found")
    return updated

@router.delete("/{question_id}")
def remove_question(question_id: str):
    success = delete_question_from_db(question_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"status": "deleted", "id": question_id}
