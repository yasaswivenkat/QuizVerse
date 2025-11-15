import sqlite3
import json
import random
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.config import DB_PATH, DATA_DIR, LEVEL_THRESHOLDS, CATEGORIES as DEFAULT_CATEGORIES

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'CAT',
        color TEXT NOT NULL DEFAULT '#6366f1',
        description TEXT NOT NULL,
        tags_json TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        difficulty TEXT NOT NULL DEFAULT 'medium',
        type TEXT NOT NULL DEFAULT 'single',
        question TEXT NOT NULL,
        options_json TEXT NOT NULL,
        answer_index INTEGER NOT NULL,
        explanation TEXT NOT NULL,
        code_snippet TEXT,
        tags_json TEXT NOT NULL DEFAULT '[]',
        time_limit_sec INTEGER DEFAULT 20,
        times_answered INTEGER DEFAULT 0,
        times_correct INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT '',
        FOREIGN KEY(category) REFERENCES categories(id) ON DELETE CASCADE
    )
    """)

    cursor.execute("PRAGMA table_info(questions)")
    existing_cols = [row[1] for row in cursor.fetchall()]
    if "created_at" not in existing_cols:
        cursor.execute("ALTER TABLE questions ADD COLUMN created_at TEXT DEFAULT ''")
    if "times_answered" not in existing_cols:
        cursor.execute("ALTER TABLE questions ADD COLUMN times_answered INTEGER DEFAULT 0")
    if "times_correct" not in existing_cols:
        cursor.execute("ALTER TABLE questions ADD COLUMN times_correct INTEGER DEFAULT 0")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        avatar TEXT DEFAULT 'User',
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        rank_title TEXT DEFAULT 'Novice Thinker',
        quizzes_played INTEGER DEFAULT 0,
        best_score INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        unlocked_badges_json TEXT DEFAULT '["first-blood"]',
        created_at TEXT NOT NULL,
        last_active TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS game_sessions (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        category TEXT NOT NULL,
        mode TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        score INTEGER NOT NULL,
        accuracy_percentage REAL NOT NULL,
        max_streak INTEGER NOT NULL,
        time_taken_seconds REAL NOT NULL,
        xp_earned INTEGER NOT NULL,
        user_answers_json TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS leaderboard (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_name TEXT NOT NULL,
        score INTEGER NOT NULL,
        xp INTEGER NOT NULL,
        accuracy_percentage REAL NOT NULL,
        category TEXT NOT NULL,
        mode TEXT NOT NULL,
        streak_max INTEGER NOT NULL,
        avatar TEXT DEFAULT 'User',
        rank_title TEXT DEFAULT 'Novice Thinker',
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS custom_quizzes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        creator_name TEXT NOT NULL,
        time_per_question INTEGER DEFAULT 25,
        questions_json TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_records (
        date_str TEXT PRIMARY KEY,
        question_ids_json TEXT NOT NULL
    )
    """)

    conn.commit()
    conn.close()

    seed_categories_if_needed()
    seed_questions_if_needed()
    seed_leaderboard_if_needed()

def seed_categories_if_needed():
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    for c in DEFAULT_CATEGORIES:
        cursor.execute("""
        INSERT INTO categories (id, name, icon, color, description, tags_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            icon = excluded.icon,
            color = excluded.color,
            description = excluded.description,
            tags_json = excluded.tags_json
        """, (c["id"], c["name"], c["icon"], c["color"], c["description"], json.dumps(c.get("tags", [])), now))
    conn.commit()
    conn.close()

def seed_questions_if_needed():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM questions")
    count = cursor.fetchone()[0]

    seed_file = DATA_DIR / "seed_questions.json"
    if seed_file.exists():
        with open(seed_file, "r", encoding="utf-8") as f:
            seed_data = json.load(f)
            if count < len(seed_data):
                now = datetime.now(timezone.utc).isoformat()
                for q in seed_data:
                    cursor.execute("""
                    INSERT OR REPLACE INTO questions (
                        id, category, difficulty, type, question, options_json,
                        answer_index, explanation, code_snippet, tags_json, time_limit_sec, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        q["id"],
                        q["category"],
                        q["difficulty"],
                        q.get("type", "single"),
                        q["question"],
                        json.dumps(q["options"]),
                        q["answer_index"],
                        q["explanation"],
                        q.get("code_snippet"),
                        json.dumps(q.get("tags", [])),
                        q.get("time_limit_sec", 20),
                        now
                    ))
                conn.commit()
    conn.close()

def seed_leaderboard_if_needed():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM leaderboard")
    count = cursor.fetchone()[0]

    if count == 0:
        sample_entries = [
            ("Aria Starlight", 3420, 2900, 95.0, "all", "classic", 14, "A", "Mind Master"),
            ("CyberGhost", 3150, 2700, 92.5, "cybersecurity", "survival", 12, "C", "Elite Tactician"),
            ("NovaCoder", 2980, 2450, 90.0, "web-dev", "speedrun", 10, "N", "Knowledge Seeker"),
            ("OrionSeeker", 2840, 2300, 88.0, "space-astronomy", "classic", 9, "O", "Knowledge Seeker"),
            ("EchoMind", 2650, 2100, 85.0, "python-ai", "ai-rival", 8, "E", "Knowledge Seeker"),
            ("AtlasTitan", 2520, 1950, 82.0, "history-mythology", "classic", 7, "AT", "Trivia Specialist"),
            ("ByteAlchemist", 2400, 1850, 80.0, "science-tech", "survival", 6, "B", "Trivia Specialist"),
            ("RiddleRanger", 2250, 1700, 80.0, "brain-teasers", "speedrun", 6, "R", "Trivia Specialist"),
        ]
        now = datetime.now(timezone.utc).isoformat()
        for name, score, xp, acc, cat, mode, streak, avatar, rank in sample_entries:
            cursor.execute("""
            INSERT INTO leaderboard (
                player_name, score, xp, accuracy_percentage, category, mode, streak_max, avatar, rank_title, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (name, score, xp, acc, cat, mode, streak, avatar, rank, now))
        conn.commit()
    conn.close()

def get_rank_for_xp(xp: int) -> str:
    for threshold in reversed(LEVEL_THRESHOLDS):
        if xp >= threshold["xp_required"]:
            return threshold["title"]
    return "Novice Thinker"

def get_all_categories_from_db() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT c.id, c.name, c.icon, c.color, c.description, c.tags_json, c.created_at,
           COUNT(q.id) as question_count
    FROM categories c
    LEFT JOIN questions q ON c.id = q.category
    GROUP BY c.id
    ORDER BY c.created_at ASC
    """)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append({
            "id": r["id"],
            "name": r["name"],
            "icon": r["icon"],
            "color": r["color"],
            "description": r["description"],
            "tags": json.loads(r["tags_json"]),
            "question_count": r["question_count"],
            "created_at": r["created_at"]
        })
    return result

def create_category_in_db(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    cat_id = data["id"].strip().lower().replace(" ", "-")

    cursor.execute("""
    INSERT INTO categories (id, name, icon, color, description, tags_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        cat_id,
        data["name"].strip(),
        data.get("icon", "CAT"),
        data.get("color", "#6366f1"),
        data.get("description", ""),
        json.dumps(data.get("tags", [])),
        now
    ))
    conn.commit()
    conn.close()
    return {**data, "id": cat_id, "created_at": now, "question_count": 0}

def delete_category_from_db(cat_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM categories WHERE id = ?", (cat_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_questions(
    category: str = "all",
    difficulty: str = "all",
    limit: int = 10,
    shuffle: bool = True
) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM questions WHERE 1=1"
    params: List[Any] = []

    if category and category != "all":
        query += " AND category = ?"
        params.append(category)

    if difficulty and difficulty != "all":
        query += " AND difficulty = ?"
        params.append(difficulty)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    questions = []
    for r in rows:
        questions.append({
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
            "time_limit_sec": r["time_limit_sec"]
        })

    if shuffle:
        random.shuffle(questions)

    return questions[:limit]

def get_question_by_id(question_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM questions WHERE id = ?", (question_id,))
    r = cursor.fetchone()
    conn.close()

    if not r:
        return None

    return {
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
        "time_limit_sec": r["time_limit_sec"]
    }

def create_question_in_db(q_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    q_id = q_data.get("id") or f"custom-{uuid.uuid4().hex[:8]}"

    cursor.execute("""
    INSERT INTO questions (
        id, category, difficulty, type, question, options_json,
        answer_index, explanation, code_snippet, tags_json, time_limit_sec, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        q_id,
        q_data["category"],
        q_data.get("difficulty", "medium"),
        q_data.get("type", "single"),
        q_data["question"],
        json.dumps(q_data["options"]),
        q_data["answer_index"],
        q_data.get("explanation", ""),
        q_data.get("code_snippet"),
        json.dumps(q_data.get("tags", [])),
        q_data.get("time_limit_sec", 20),
        now
    ))
    conn.commit()
    conn.close()
    return {**q_data, "id": q_id, "created_at": now}

def update_question_in_db(q_id: str, q_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    UPDATE questions SET
        category = ?, difficulty = ?, type = ?, question = ?,
        options_json = ?, answer_index = ?, explanation = ?,
        code_snippet = ?, tags_json = ?, time_limit_sec = ?
    WHERE id = ?
    """, (
        q_data["category"],
        q_data.get("difficulty", "medium"),
        q_data.get("type", "single"),
        q_data["question"],
        json.dumps(q_data["options"]),
        q_data["answer_index"],
        q_data.get("explanation", ""),
        q_data.get("code_snippet"),
        json.dumps(q_data.get("tags", [])),
        q_data.get("time_limit_sec", 20),
        q_id
    ))
    updated = cursor.rowcount > 0
    conn.commit()
    conn.close()

    if not updated:
        return None
    return get_question_by_id(q_id)

def delete_question_from_db(q_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM questions WHERE id = ?", (q_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def record_question_answer_stat(q_id: str, is_correct: bool):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE questions SET
        times_answered = times_answered + 1,
        times_correct = times_correct + ?
    WHERE id = ?
    """, (1 if is_correct else 0, q_id))
    conn.commit()
    conn.close()

def get_or_create_user(username: str, avatar: str = "User") -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()

    now = datetime.now(timezone.utc).isoformat()
    if row:
        cursor.execute("UPDATE users SET last_active = ? WHERE username = ?", (now, username))
        conn.commit()
        user_dict = {
            "id": row["id"],
            "username": row["username"],
            "avatar": row["avatar"],
            "xp": row["xp"],
            "level": row["level"],
            "rank_title": row["rank_title"],
            "quizzes_played": row["quizzes_played"],
            "best_score": row["best_score"],
            "best_streak": row["best_streak"],
            "unlocked_badges": json.loads(row["unlocked_badges_json"]),
            "created_at": row["created_at"],
            "last_active": now
        }
    else:
        cursor.execute("""
        INSERT INTO users (username, avatar, xp, level, rank_title, quizzes_played, best_score, best_streak, unlocked_badges_json, created_at, last_active)
        VALUES (?, ?, 0, 1, 'Novice Thinker', 0, 0, 0, '["first-blood"]', ?, ?)
        """, (username, avatar, now, now))
        conn.commit()
        new_id = cursor.lastrowid
        user_dict = {
            "id": new_id,
            "username": username,
            "avatar": avatar,
            "xp": 0,
            "level": 1,
            "rank_title": "Novice Thinker",
            "quizzes_played": 0,
            "best_score": 0,
            "best_streak": 0,
            "unlocked_badges": ["first-blood"],
            "created_at": now,
            "last_active": now
        }

    conn.close()
    return user_dict

def update_user_profile_in_db(username: str, avatar: str = None, xp_delta: int = 0, score: int = 0, streak: int = 0, badge_id: str = None) -> Dict[str, Any]:
    user = get_or_create_user(username)
    conn = get_connection()
    cursor = conn.cursor()

    new_xp = max(0, user["xp"] + xp_delta)
    rank = get_rank_for_xp(new_xp)
    level = user["level"]

    for t in reversed(LEVEL_THRESHOLDS):
        if new_xp >= t["xp_required"]:
            level = t["level"]
            break

    best_score = max(user["best_score"], score)
    best_streak = max(user["best_streak"], streak)
    badges = user["unlocked_badges"]
    if badge_id and badge_id not in badges:
        badges.append(badge_id)

    new_avatar = avatar if avatar else user["avatar"]
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    UPDATE users SET
        avatar = ?,
        xp = ?,
        level = ?,
        rank_title = ?,
        quizzes_played = quizzes_played + 1,
        best_score = ?,
        best_streak = ?,
        unlocked_badges_json = ?,
        last_active = ?
    WHERE username = ?
    """, (new_avatar, new_xp, level, rank, best_score, best_streak, json.dumps(badges), now, username))
    conn.commit()
    conn.close()

    return get_or_create_user(username)

def save_game_session_to_db(session_data: Dict[str, Any]) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    session_id = f"SES-{uuid.uuid4().hex[:10].upper()}"

    cursor.execute("""
    INSERT INTO game_sessions (
        id, username, category, mode, difficulty, score, accuracy_percentage,
        max_streak, time_taken_seconds, xp_earned, user_answers_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        session_id,
        session_data.get("username", "Anonymous"),
        session_data.get("category", "all"),
        session_data.get("mode", "classic"),
        session_data.get("difficulty", "medium"),
        session_data.get("score", 0),
        session_data.get("accuracy_percentage", 0.0),
        session_data.get("max_streak", 0),
        session_data.get("time_taken_seconds", 0.0),
        session_data.get("xp_earned", 0),
        json.dumps(session_data.get("user_answers", [])),
        now
    ))
    conn.commit()
    conn.close()
    return session_id

def get_game_sessions_from_db(limit: int = 20, username: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if username:
        cursor.execute("SELECT * FROM game_sessions WHERE username = ? ORDER BY created_at DESC LIMIT ?", (username, limit))
    else:
        cursor.execute("SELECT * FROM game_sessions ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()

    sessions = []
    for r in rows:
        sessions.append({
            "id": r["id"],
            "username": r["username"],
            "category": r["category"],
            "mode": r["mode"],
            "difficulty": r["difficulty"],
            "score": r["score"],
            "accuracy_percentage": r["accuracy_percentage"],
            "max_streak": r["max_streak"],
            "time_taken_seconds": r["time_taken_seconds"],
            "xp_earned": r["xp_earned"],
            "created_at": r["created_at"]
        })
    return sessions

def add_leaderboard_entry(
    player_name: str,
    score: int,
    xp: int,
    accuracy: float,
    category: str,
    mode: str,
    streak_max: int,
    avatar: str = "User"
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    rank = get_rank_for_xp(xp)

    cursor.execute("""
    INSERT INTO leaderboard (
        player_name, score, xp, accuracy_percentage, category, mode, streak_max, avatar, rank_title, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (player_name, score, xp, round(accuracy, 1), category, mode, streak_max, avatar, rank, now))

    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": new_id,
        "player_name": player_name,
        "score": score,
        "xp": xp,
        "accuracy_percentage": round(accuracy, 1),
        "category": category,
        "mode": mode,
        "streak_max": streak_max,
        "avatar": avatar,
        "rank_title": rank,
        "date_achieved": now
    }

def get_leaderboard(category: str = "all", mode: str = "all", limit: int = 25) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM leaderboard WHERE 1=1"
    params: List[Any] = []

    if category and category != "all":
        query += " AND category = ?"
        params.append(category)

    if mode and mode != "all":
        query += " AND mode = ?"
        params.append(mode)

    query += " ORDER BY score DESC, xp DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "player_name": r["player_name"],
            "score": r["score"],
            "xp": r["xp"],
            "accuracy_percentage": r["accuracy_percentage"],
            "category": r["category"],
            "mode": r["mode"],
            "streak_max": r["streak_max"],
            "avatar": r["avatar"],
            "rank_title": r["rank_title"],
            "created_at": r["created_at"]
        })
    return results

def save_custom_quiz(quiz_id: str, quiz_data: Dict[str, Any]) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
    INSERT INTO custom_quizzes (
        id, title, description, category, creator_name, time_per_question, questions_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        quiz_id,
        quiz_data["title"],
        quiz_data["description"],
        quiz_data.get("category", "custom"),
        quiz_data.get("creator_name", "Anonymous"),
        quiz_data.get("time_per_question", 25),
        json.dumps(quiz_data["questions"]),
        now
    ))
    conn.commit()
    conn.close()
    return quiz_id

def get_custom_quiz(quiz_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM custom_quizzes WHERE id = ?", (quiz_id,))
    r = cursor.fetchone()
    conn.close()

    if not r:
        return None

    return {
        "id": r["id"],
        "title": r["title"],
        "description": r["description"],
        "category": r["category"],
        "creator_name": r["creator_name"],
        "time_per_question": r["time_per_question"],
        "questions": json.loads(r["questions_json"]),
        "created_at": r["created_at"]
    }

def get_daily_questions(date_str: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT question_ids_json FROM daily_records WHERE date_str = ?", (date_str,))
    row = cursor.fetchone()

    if row:
        ids = json.loads(row[0])
        conn.close()
        questions = []
        for qid in ids:
            q = get_question_by_id(qid)
            if q:
                questions.append(q)
        return questions

    cursor.execute("SELECT id FROM questions")
    all_ids = [r[0] for r in cursor.fetchall()]

    rng = random.Random(date_str)
    selected_ids = rng.sample(all_ids, min(5, len(all_ids)))

    cursor.execute("""
    INSERT INTO daily_records (date_str, question_ids_json) VALUES (?, ?)
    """, (date_str, json.dumps(selected_ids)))
    conn.commit()
    conn.close()

    questions = []
    for qid in selected_ids:
        q = get_question_by_id(qid)
        if q:
            questions.append(q)
    return questions

def get_platform_stats() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM questions")
    total_q = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM categories")
    total_cats = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM game_sessions")
    total_games = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM users")
    total_users = cursor.fetchone()[0]

    cursor.execute("SELECT MAX(score), player_name FROM leaderboard")
    top_row = cursor.fetchone()
    highest_score = top_row[0] if top_row and top_row[0] else 3420
    top_player = top_row[1] if top_row and top_row[1] else "Aria Starlight"

    conn.close()

    return {
        "total_questions": total_q,
        "total_categories": total_cats,
        "total_quizzes_played": max(total_games, 8),
        "total_leaderboard_entries": max(total_games, 8),
        "total_users": max(total_users, 1),
        "highest_score": highest_score,
        "top_player": top_player
    }
