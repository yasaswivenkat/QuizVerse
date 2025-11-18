from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.models import LeaderboardEntry, LeaderboardSubmitRequest
from app.database import get_leaderboard, add_leaderboard_entry

router = APIRouter(prefix="/api/leaderboard", tags=["Leaderboard"])

@router.get("", response_model=List[LeaderboardEntry])
def fetch_leaderboard(
    category: str = Query("all", description="Category filter"),
    mode: str = Query("all", description="Mode filter"),
    limit: int = Query(20, ge=1, le=100)
):
    rows = get_leaderboard(category=category, mode=mode, limit=limit)
    return [LeaderboardEntry(**r) for r in rows]

@router.post("", response_model=LeaderboardEntry)
def submit_score(entry: LeaderboardSubmitRequest):
    if entry.score < 0:
        raise HTTPException(status_code=400, detail="Score cannot be negative")

    saved = add_leaderboard_entry(
        player_name=entry.player_name,
        score=entry.score,
        xp=entry.xp,
        accuracy=entry.accuracy_percentage,
        category=entry.category,
        mode=entry.mode,
        streak_max=entry.streak_max,
        avatar=entry.avatar
    )
    return LeaderboardEntry(**saved)
