from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class QuestionOption(BaseModel):
    index: int
    text: str

class QuestionModel(BaseModel):
    id: str
    category: str
    difficulty: str
    type: str = "single"
    question: str
    options: List[str]
    answer_index: int
    explanation: str
    code_snippet: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    time_limit_sec: int = 20

class ClientQuestion(BaseModel):
    id: str
    category: str
    difficulty: str
    type: str
    question: str
    options: List[str]
    has_code: bool = False
    code_snippet: Optional[str] = None
    time_limit_sec: int = 20

class QuizRequest(BaseModel):
    category: Optional[str] = "all"
    difficulty: Optional[str] = "all"
    mode: Optional[str] = "classic"
    limit: Optional[int] = 10

class AnswerSubmission(BaseModel):
    question_id: str
    selected_index: int
    time_spent_seconds: float
    streak: int = 0
    lifelines_used: List[str] = Field(default_factory=list)

class EvaluationResult(BaseModel):
    question_id: str
    is_correct: bool
    correct_index: int
    correct_answer: str
    explanation: str
    score_delta: int
    xp_earned: int
    streak: int
    streak_multiplier: float
    speed_bonus: int
    fun_fact: Optional[str] = None

class LifelineRequest(BaseModel):
    type: str
    question_id: str

class LifelineResponse(BaseModel):
    type: str
    question_id: str
    eliminated_indices: Optional[List[int]] = None
    oracle_hint: Optional[str] = None
    audience_votes: Optional[Dict[str, int]] = None
    freeze_seconds: Optional[int] = None
    message: str

class LeaderboardEntry(BaseModel):
    id: Optional[int] = None
    player_name: str = Field(..., min_length=2, max_length=30)
    score: int
    xp: int
    accuracy_percentage: float
    category: str
    mode: str
    streak_max: int
    date_achieved: Optional[str] = None
    avatar: str = "User"
    rank_title: Optional[str] = "Novice Thinker"

class LeaderboardSubmitRequest(BaseModel):
    player_name: str = Field(..., min_length=2, max_length=30)
    score: int
    xp: int
    accuracy_percentage: float
    category: str
    mode: str
    streak_max: int
    avatar: str = "User"

class CustomQuestionInput(BaseModel):
    question: str = Field(..., min_length=5)
    options: List[str] = Field(..., min_length=2, max_length=4)
    answer_index: int
    explanation: str
    difficulty: str = "medium"
    code_snippet: Optional[str] = None

class CustomQuizCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=80)
    description: str = Field(..., max_length=300)
    category: str = "custom"
    creator_name: str = Field("Anonymous", max_length=40)
    time_per_question: int = Field(25, ge=10, le=60)
    questions: List[CustomQuestionInput] = Field(..., min_length=3)

class DailyChallengeResponse(BaseModel):
    date: str
    title: str
    bonus_xp: int
    questions: List[ClientQuestion]

class DailySubmission(BaseModel):
    player_name: str
    score: int
    accuracy_percentage: float
    streak_days: int

class PlatformStats(BaseModel):
    total_questions: int
    total_categories: int
    total_quizzes_played: int
    total_leaderboard_entries: int
    highest_score: int
    top_player: str
