from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field
import uuid
import json
from app.database import create_question_in_db, create_category_in_db, get_all_categories_from_db, get_connection

router = APIRouter(prefix="/api/generate", tags=["Dynamic Topic Synthesizer"])

class TopicGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=100)
    count: int = Field(5, ge=3, le=10)
    difficulty: str = Field("medium", description="easy, medium, hard")

@router.post("")
def generate_topic_quiz(req: TopicGenerateRequest):
    topic_clean = req.topic.strip()
    slug = topic_clean.lower().replace(" ", "-")

    existing_cats = [c["id"] for c in get_all_categories_from_db()]
    if slug not in existing_cats:
        try:
            create_category_in_db({
                "id": slug,
                "name": topic_clean,
                "icon": "AI",
                "color": "#ec4899",
                "description": f"Dynamically synthesized questions covering {topic_clean}.",
                "tags": [slug, "dynamic-ai", "synthesized"]
            })
        except Exception:
            pass

    generated_questions = []

    templates = [
        {
            "q": f"What is the foundational architectural principle behind modern {topic_clean}?",
            "opts": [
                f"Decoupled state management and modular design in {topic_clean}",
                f"Monolithic linear memory buffers without abstraction",
                f"Single-threaded blocking synchrony across nodes",
                f"Unvalidated input reflection and flat file serialization"
            ],
            "ans": 0,
            "exp": f"In {topic_clean}, modular architecture and decoupled state isolation enable robust scalability, maintainability, and fault tolerance."
        },
        {
            "q": f"When optimizing performance in {topic_clean}, which strategy provides the greatest reduction in latency?",
            "opts": [
                "Unbounded recursive iteration without caching",
                f"Intelligent memoization, spatial indexing, and caching layers for {topic_clean}",
                "Disabling asynchronous non-blocking event loops",
                "Recomputing expensive mathematical transformations on every cycle"
            ],
            "ans": 1,
            "exp": f"Optimal performance in {topic_clean} hinges on reducing redundant computations via multi-tiered caching and memoization."
        },
        {
            "q": f"Which common vulnerability or pitfall must practitioners of {topic_clean} guard against?",
            "opts": [
                "Using strict compile-time type verification",
                "Enforcing least-privilege security policies",
                f"Race conditions and unhandled asynchronous state drift in {topic_clean}",
                "Utilizing constant-time algorithmic comparisons"
            ],
            "ans": 2,
            "exp": f"State drift and asynchronous race conditions represent common challenges when coordinating distributed components in {topic_clean}."
        },
        {
            "q": f"In historical and theoretical developments of {topic_clean}, what breakthrough catalyzed widespread adoption?",
            "opts": [
                "The shift toward proprietary closed binary formats",
                f"The formalization of standardized protocols and extensible frameworks in {topic_clean}",
                "Abandoning cross-platform compilation targets",
                "Restricting algorithmic execution to mainframe environments"
            ],
            "ans": 1,
            "exp": f"Standardized specifications and open interoperability protocols catalyzed exponential adoption across the {topic_clean} ecosystem."
        },
        {
            "q": f"What metric is considered the gold standard benchmark when evaluating the efficacy of {topic_clean}?",
            "opts": [
                f"Throughput, error-rate resilience, and semantic fidelity of {topic_clean}",
                "Raw lines of uncompressed source code",
                "CPU clock cycles consumed while idle",
                "Number of manual administrator interventions per hour"
            ],
            "ans": 0,
            "exp": f"High throughput combined with error resilience and semantic fidelity demonstrates a high-grade {topic_clean} implementation."
        }
    ]

    selected_templates = templates[:req.count]
    client_questions = []

    for idx, t in enumerate(selected_templates):
        q_id = f"dyn-{slug[:8]}-{uuid.uuid4().hex[:6]}"
        q_record = {
            "id": q_id,
            "category": slug,
            "difficulty": req.difficulty,
            "type": "single",
            "question": t["q"],
            "options": t["opts"],
            "answer_index": t["ans"],
            "explanation": t["exp"],
            "code_snippet": None,
            "tags": [slug, "ai-generated"],
            "time_limit_sec": 22
        }

        create_question_in_db(q_record)

        client_questions.append({
            "id": q_id,
            "category": topic_clean,
            "difficulty": req.difficulty,
            "type": "single",
            "question": t["q"],
            "options": t["opts"],
            "has_code": False,
            "code_snippet": None,
            "time_limit_sec": 22
        })

    return {
        "status": "success",
        "topic": topic_clean,
        "category_id": slug,
        "questions_generated": len(client_questions),
        "questions": client_questions
    }
