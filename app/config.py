from pathlib import Path
from typing import Dict, Any, List

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "app" / "data"
DB_PATH = BASE_DIR / "quizverse.db"

APP_NAME = "QuizVerse"
APP_VERSION = "2.0.0"
APP_DESCRIPTION = "Next-Generation Interactive Quiz & Battle Arena Platform"

XP_PER_CORRECT_ANSWER = 100
XP_STREAK_BONUS_MULTIPLIER = 15
XP_SPEED_BONUS_MAX = 50
XP_SURVIVAL_ROUND_BONUS = 75
XP_DAILY_CHALLENGE_BONUS = 300

LEVEL_THRESHOLDS = [
    {"level": 1, "title": "Novice Thinker", "xp_required": 0, "icon": "L1"},
    {"level": 2, "title": "Curious Explorer", "xp_required": 400, "icon": "L2"},
    {"level": 3, "title": "Trivia Specialist", "xp_required": 1000, "icon": "L3"},
    {"level": 4, "title": "Knowledge Seeker", "xp_required": 2000, "icon": "L4"},
    {"level": 5, "title": "Elite Tactician", "xp_required": 3500, "icon": "L5"},
    {"level": 6, "title": "Mind Master", "xp_required": 5500, "icon": "L6"},
    {"level": 7, "title": "Cognitive Legend", "xp_required": 8000, "icon": "L7"},
    {"level": 8, "title": "Grandmaster of Quiz", "xp_required": 12000, "icon": "L8"},
]

CATEGORIES: List[Dict[str, Any]] = [
    {
        "id": "web-dev",
        "name": "Web Dev & JavaScript",
        "icon": "WEB",
        "color": "#38bdf8",
        "description": "Modern frontend, async JS, CSS tricks, DOM mastery, and browser engines.",
        "tags": ["javascript", "css", "html5", "web-apis", "react"]
    },
    {
        "id": "python-ai",
        "name": "Python & Artificial Intelligence",
        "icon": "PY",
        "color": "#fbbf24",
        "description": "Python idioms, neural networks, LLMs, data science, and async Python.",
        "tags": ["python", "ai", "machine-learning", "algorithms", "data"]
    },
    {
        "id": "cybersecurity",
        "name": "Cybersecurity & Cloud",
        "icon": "SEC",
        "color": "#f87171",
        "description": "Penetration testing, cryptography, Zero-Trust, Docker, and AWS/Cloud architectures.",
        "tags": ["security", "crypto", "networking", "cloud", "devops"]
    },
    {
        "id": "space-astronomy",
        "name": "Cosmos & Astrophysics",
        "icon": "SPACE",
        "color": "#c084fc",
        "description": "Black holes, James Webb discoveries, planetary orbits, and quantum relativity.",
        "tags": ["space", "astronomy", "physics", "nasa", "universe"]
    },
    {
        "id": "history-mythology",
        "name": "World History & Lore",
        "icon": "HIST",
        "color": "#f59e0b",
        "description": "Ancient empires, revolutions, mythologies, and forgotten historical twists.",
        "tags": ["history", "mythology", "archaeology", "civilizations"]
    },
    {
        "id": "science-tech",
        "name": "Science & Emerging Tech",
        "icon": "SCI",
        "color": "#34d399",
        "description": "Quantum mechanics, genetic editing, nanotech, and energy revolutions.",
        "tags": ["science", "quantum", "biotech", "energy", "inventions"]
    },
    {
        "id": "brain-teasers",
        "name": "Brain Teasers & Logic",
        "icon": "LOGIC",
        "color": "#ec4899",
        "description": "Lateral thinking paradoxes, mathematical riddles, and deduction puzzles.",
        "tags": ["logic", "riddles", "math", "puzzles", "reasoning"]
    },
    {
        "id": "cinema-pop",
        "name": "Cinema & Pop Culture",
        "icon": "CINEMA",
        "color": "#a78bfa",
        "description": "Sci-Fi epics, gaming lore, Oscar trivia, soundtrack legends, and animation.",
        "tags": ["cinema", "pop-culture", "gaming", "music", "movies"]
    }
]

MODES: List[Dict[str, Any]] = [
    {
        "id": "classic",
        "name": "Classic Quest",
        "icon": "QUEST",
        "description": "Choose your category and difficulty. Perfect for measured learning and high scores.",
        "badge": "Standard"
    },
    {
        "id": "survival",
        "name": "Survival 3 Hearts",
        "icon": "SURVIVE",
        "description": "3 lives only. Difficulty climbs progressively. How long can your streak survive?",
        "badge": "Hardcore"
    },
    {
        "id": "speedrun",
        "name": "Time Blitz 60s",
        "icon": "BLITZ",
        "description": "60 seconds ticking. +3s for correct answers, -2s for misses. High adrenaline speedrun!",
        "badge": "Fast-Paced"
    },
    {
        "id": "ai-rival",
        "name": "AI Rival Arena",
        "icon": "RIVAL",
        "description": "Go head-to-head with an adaptive AI rival. Real-time avatar emotions, trash talk & live scoring!",
        "badge": "Unique Duel"
    }
]
