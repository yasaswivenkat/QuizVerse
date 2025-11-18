from fastapi import APIRouter
from datetime import datetime, timezone
from app.models import DailyChallengeResponse, ClientQuestion, DailySubmission
from app.database import get_daily_questions
from app.config import XP_DAILY_CHALLENGE_BONUS

router = APIRouter(prefix="/api/daily", tags=["Daily Challenge"])

@router.get("", response_model=DailyChallengeResponse)
def get_daily_challenge():
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    raw_questions = get_daily_questions(today_str)

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

    return DailyChallengeResponse(
        date=today_str,
        title=f"Daily Master Challenge • {today_str}",
        bonus_xp=XP_DAILY_CHALLENGE_BONUS,
        questions=client_questions
    )

@router.post("/submit")
def submit_daily_challenge(sub: DailySubmission):
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    bonus = XP_DAILY_CHALLENGE_BONUS + (sub.streak_days * 50)
    return {
        "status": "success",
        "date": today_str,
        "bonus_xp_awarded": bonus,
        "new_streak_days": sub.streak_days + 1,
        "message": f"Daily Challenge completed! +{bonus} XP bonus earned!"
    }
