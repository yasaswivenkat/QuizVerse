from fastapi import APIRouter
import json
from app.models import PlatformStats
from app.database import get_platform_stats
from app.config import DATA_DIR, LEVEL_THRESHOLDS

router = APIRouter(prefix="/api/stats", tags=["Stats & Badges"])

@router.get("/overview", response_model=PlatformStats)
def fetch_overview():
    stats = get_platform_stats()
    return PlatformStats(**stats)

@router.get("/badges")
def fetch_all_badges():
    badges_file = DATA_DIR / "badges.json"
    if badges_file.exists():
        with open(badges_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@router.get("/levels")
def fetch_level_thresholds():
    return LEVEL_THRESHOLDS
