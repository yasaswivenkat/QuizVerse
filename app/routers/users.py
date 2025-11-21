from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field
from app.database import (
    get_or_create_user, update_user_profile_in_db,
    save_game_session_to_db, get_game_sessions_from_db
)

router = APIRouter(prefix="/api/users", tags=["Users & Dynamic History"])

class UserProfileUpdate(BaseModel):
    username: str
    avatar: Optional[str] = "User"

class GameSessionCreate(BaseModel):
    username: str
    category: str
    mode: str
    difficulty: str
    score: int
    accuracy_percentage: float
    max_streak: int
    time_taken_seconds: float
    xp_earned: int
    user_answers: List[dict] = Field(default_factory=list)

@router.get("/{username}")
def fetch_user_profile(username: str):
    user = get_or_create_user(username)
    return user

@router.post("")
def sync_user_profile(payload: UserProfileUpdate):
    user = get_or_create_user(payload.username, payload.avatar)
    return user

@router.post("/sessions")
def record_game_session(session: GameSessionCreate):
    session_id = save_game_session_to_db(session.model_dump())
    updated_user = update_user_profile_in_db(
        username=session.username,
        xp_delta=session.xp_earned,
        score=session.score,
        streak=session.max_streak
    )
    return {
        "status": "recorded",
        "session_id": session_id,
        "user": updated_user
    }

@router.get("/{username}/history")
def fetch_user_history(username: str):
    history = get_game_sessions_from_db(limit=25, username=username)
    return history

@router.get("/sessions/all")
def fetch_all_sessions():
    sessions = get_game_sessions_from_db(limit=30)
    return sessions
