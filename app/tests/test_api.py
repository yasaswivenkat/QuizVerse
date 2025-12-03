import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["architecture"] == "fully-dynamic-relational"

def test_root_and_static_delivery():
    res_root = client.get("/")
    assert res_root.status_code == 200
    assert "QuizVerse" in res_root.text
    assert "Database Hub" in res_root.text

    res_css = client.get("/static/css/variables.css")
    assert res_css.status_code == 200
    assert "--font-display" in res_css.text

    res_js = client.get("/static/js/app.js")
    assert res_js.status_code == 200
    assert "QuizVerseApp" in res_js.text

def test_categories_endpoint():
    response = client.get("/api/quiz/categories")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert len(data["categories"]) >= 8
    assert "modes" in data
    assert len(data["modes"]) >= 4

def test_questions_endpoint():
    response = client.get("/api/quiz/questions?limit=5")
    assert response.status_code == 200
    questions = response.json()
    assert len(questions) == 5
    for q in questions:
        assert "answer_index" not in q
        assert "explanation" not in q
        assert len(q["options"]) >= 2
        assert q["id"] is not None

def test_answer_evaluation_correct_and_wrong():
    questions = client.get("/api/quiz/questions?limit=1").json()
    first_q = questions[0]
    qid = first_q["id"]

    res = client.post("/api/quiz/evaluate", json={
        "question_id": qid,
        "selected_index": 0,
        "time_spent_seconds": 3.5,
        "streak": 2,
        "lifelines_used": []
    })
    assert res.status_code == 200
    data = res.json()
    assert "is_correct" in data
    assert "correct_index" in data
    assert "explanation" in data

    correct_idx = data["correct_index"]
    res_correct = client.post("/api/quiz/evaluate", json={
        "question_id": qid,
        "selected_index": correct_idx,
        "time_spent_seconds": 2.0,
        "streak": 3,
        "lifelines_used": []
    })
    assert res_correct.status_code == 200
    correct_data = res_correct.json()
    assert correct_data["is_correct"] is True
    assert correct_data["score_delta"] > 0
    assert correct_data["xp_earned"] > 0
    assert correct_data["streak"] == 4

def test_lifelines():
    questions = client.get("/api/quiz/questions?limit=1").json()
    qid = questions[0]["id"]

    res_5050 = client.post("/api/lifelines/use", json={
        "type": "50-50",
        "question_id": qid
    })
    assert res_5050.status_code == 200
    assert "eliminated_indices" in res_5050.json()

    res_oracle = client.post("/api/lifelines/use", json={
        "type": "oracle-hint",
        "question_id": qid
    })
    assert res_oracle.status_code == 200
    assert "oracle_hint" in res_oracle.json()

    res_poll = client.post("/api/lifelines/use", json={
        "type": "audience-poll",
        "question_id": qid
    })
    assert res_poll.status_code == 200
    votes = res_poll.json()["audience_votes"]
    assert isinstance(votes, dict)
    assert sum(votes.values()) >= 90

def test_daily_challenge():
    res = client.get("/api/daily")
    assert res.status_code == 200
    data = res.json()
    assert "date" in data
    assert len(data["questions"]) == 5

    res_sub = client.post("/api/daily/submit", json={
        "player_name": "TestChallenger",
        "score": 850,
        "accuracy_percentage": 100.0,
        "streak_days": 2
    })
    assert res_sub.status_code == 200
    assert res_sub.json()["new_streak_days"] == 3

def test_leaderboard():
    submit_res = client.post("/api/leaderboard", json={
        "player_name": "AntigravityTest",
        "score": 2500,
        "xp": 2000,
        "accuracy_percentage": 90.0,
        "category": "web-dev",
        "mode": "classic",
        "streak_max": 8,
        "avatar": "User"
    })
    assert submit_res.status_code == 200

    list_res = client.get("/api/leaderboard?limit=10")
    assert list_res.status_code == 200
    entries = list_res.json()
    assert len(entries) > 0
    names = [e["player_name"] for e in entries]
    assert "AntigravityTest" in names

def test_custom_quiz_lifecycle():
    quiz_payload = {
        "title": "Quantum Odyssey Test",
        "description": "Testing custom quizzes in QuizVerse",
        "category": "science-tech",
        "creator_name": "Dr. Test",
        "time_per_question": 20,
        "questions": [
            {
                "question": "What is the speed of light in vacuum?",
                "options": ["300,000 km/s", "150,000 km/s", "1,000 km/s"],
                "answer_index": 0,
                "explanation": "Light travels at ~299,792 km/s in vacuum.",
                "difficulty": "easy"
            },
            {
                "question": "Which particle has zero electric charge?",
                "options": ["Proton", "Neutron", "Electron"],
                "answer_index": 1,
                "explanation": "Neutrons are electrically neutral.",
                "difficulty": "easy"
            },
            {
                "question": "What is absolute zero in Celsius?",
                "options": ["-100 C", "-273.15 C", "0 C"],
                "answer_index": 1,
                "explanation": "0 Kelvin corresponds to -273.15 degrees Celsius.",
                "difficulty": "medium"
            }
        ]
    }
    create_res = client.post("/api/custom-quiz", json=quiz_payload)
    assert create_res.status_code == 200
    data = create_res.json()
    quiz_id = data["quiz_id"]
    assert quiz_id.startswith("QZ-")

    fetch_res = client.get(f"/api/custom-quiz/{quiz_id}")
    assert fetch_res.status_code == 200
    q_data = fetch_res.json()
    assert q_data["title"] == "Quantum Odyssey Test"
    assert len(q_data["questions"]) == 3

def test_stats_and_badges():
    stats_res = client.get("/api/stats/overview")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_questions"] >= 80

    badges_res = client.get("/api/stats/badges")
    assert badges_res.status_code == 200
    badges = badges_res.json()
    assert len(badges) >= 10

def test_dynamic_categories_crud():
    cat_payload = {
        "id": "quantum-ml",
        "name": "Quantum Machine Learning",
        "icon": "Q",
        "color": "#8b5cf6",
        "description": "Hybrid quantum-classical algorithms and QNN architectures.",
        "tags": ["quantum", "ml", "algorithms"]
    }
    res_create = client.post("/api/categories", json=cat_payload)
    assert res_create.status_code == 200
    assert res_create.json()["id"] == "quantum-ml"

    res_list = client.get("/api/categories")
    assert res_list.status_code == 200
    cat_ids = [c["id"] for c in res_list.json()["categories"]]
    assert "quantum-ml" in cat_ids

    res_del = client.delete("/api/categories/quantum-ml")
    assert res_del.status_code == 200

def test_dynamic_questions_crud():
    q_payload = {
        "category": "web-dev",
        "difficulty": "medium",
        "type": "code",
        "question": "What is the return value of Boolean([]) in JavaScript?",
        "options": ["true", "false", "undefined", "TypeError"],
        "answer_index": 0,
        "explanation": "All objects and arrays in JavaScript are truthy values, so Boolean([]) evaluates to true.",
        "code_snippet": "console.log(Boolean([]));",
        "tags": ["javascript", "coercion"],
        "time_limit_sec": 20
    }
    res_create = client.post("/api/questions", json=q_payload)
    assert res_create.status_code == 200
    q_id = res_create.json()["id"]

    res_browse = client.get("/api/questions?search=Boolean([])")
    assert res_browse.status_code == 200
    items = res_browse.json()["items"]
    assert any(x["id"] == q_id for x in items)

    update_payload = dict(q_payload)
    update_payload["difficulty"] = "hard"
    res_update = client.put(f"/api/questions/{q_id}", json=update_payload)
    assert res_update.status_code == 200
    assert res_update.json()["difficulty"] == "hard"

    res_del = client.delete(f"/api/questions/{q_id}")
    assert res_del.status_code == 200

def test_dynamic_topic_synthesizer():
    res_synth = client.post("/api/generate", json={
        "topic": "Neuromorphic Computing",
        "count": 5,
        "difficulty": "hard"
    })
    assert res_synth.status_code == 200
    data = res_synth.json()
    assert data["status"] == "success"
    assert data["topic"] == "Neuromorphic Computing"
    assert len(data["questions"]) == 5

    cat_slug = data["category_id"]
    res_q = client.get(f"/api/quiz/questions?category={cat_slug}&limit=5")
    assert res_q.status_code == 200
    assert len(res_q.json()) >= 3

def test_dynamic_user_and_sessions():
    user_res = client.post("/api/users", json={
        "username": "QuantumVoyager",
        "avatar": "User"
    })
    assert user_res.status_code == 200
    assert user_res.json()["username"] == "QuantumVoyager"

    session_res = client.post("/api/users/sessions", json={
        "username": "QuantumVoyager",
        "category": "web-dev",
        "mode": "classic",
        "difficulty": "medium",
        "score": 1850,
        "accuracy_percentage": 90.0,
        "max_streak": 7,
        "time_taken_seconds": 45.2,
        "xp_earned": 500,
        "user_answers": [
            {"question": "Q1", "isCorrect": True, "timeSpent": 2.1}
        ]
    })
    assert session_res.status_code == 200
    data = session_res.json()
    assert data["status"] == "recorded"
    assert data["session_id"].startswith("SES-")

    history_res = client.get("/api/users/QuantumVoyager/history")
    assert history_res.status_code == 200
    sessions = history_res.json()
    assert len(sessions) > 0
    assert sessions[0]["score"] == 1850

def test_websocket_battle_connection():
    with client.websocket_connect("/ws/battle/room-101") as ws:
        ws.send_json({
            "type": "join",
            "player_name": "PlayerAlpha",
            "avatar": "User"
        })
        msg = ws.receive_json()
        assert msg["type"] == "player_joined"
        assert msg["player_name"] == "PlayerAlpha"

        ws.send_json({
            "type": "score_update",
            "player_name": "PlayerAlpha",
            "score": 300,
            "progress": 3,
            "streak": 3
        })
        score_msg = ws.receive_json()
        assert score_msg["type"] == "live_score"
        assert score_msg["score"] == 300
