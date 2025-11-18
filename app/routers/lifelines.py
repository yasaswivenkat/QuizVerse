import random
from typing import Dict
from fastapi import APIRouter, HTTPException
from app.models import LifelineRequest, LifelineResponse
from app.database import get_question_by_id

router = APIRouter(prefix="/api/lifelines", tags=["Lifelines"])

@router.post("/use", response_model=LifelineResponse)
def use_lifeline(req: LifelineRequest):
    q = get_question_by_id(req.question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    correct_idx = q["answer_index"]
    num_options = len(q["options"])

    if req.type == "50-50":
        wrong_indices = [i for i in range(num_options) if i != correct_idx]
        if len(wrong_indices) <= 1:
            eliminated = []
            message = "Optimal for two-choice questions."
        else:
            random.shuffle(wrong_indices)
            eliminated = wrong_indices[:2]
            message = "Two incorrect choices eliminated."

        return LifelineResponse(
            type="50-50",
            question_id=req.question_id,
            eliminated_indices=eliminated,
            message=message
        )

    elif req.type == "oracle-hint":
        explanation = q.get("explanation", "")
        tags = q.get("tags", [])
        hints_pool = [
            f"Core principle: {explanation.split('.')[0] if '.' in explanation else explanation}",
            f"Consider tags related to: {', '.join(tags)}.",
            f"Recall fundamental principles of {q.get('category')}."
        ]
        chosen_hint = random.choice(hints_pool)

        return LifelineResponse(
            type="oracle-hint",
            question_id=req.question_id,
            oracle_hint=chosen_hint,
            message="Oracle clue revealed."
        )

    elif req.type == "audience-poll":
        accuracy_weight = {"easy": 75, "medium": 55, "hard": 42}.get(q.get("difficulty"), 60)
        votes: Dict[str, int] = {}
        letters = ["A", "B", "C", "D"]

        remaining_percentage = 100
        correct_vote = random.randint(accuracy_weight - 8, min(88, accuracy_weight + 12))
        remaining_percentage -= correct_vote

        other_indices = [i for i in range(num_options) if i != correct_idx]
        random_splits = []
        for _ in range(len(other_indices) - 1):
            val = random.randint(5, max(6, remaining_percentage // len(other_indices)))
            random_splits.append(val)
            remaining_percentage -= val
        random_splits.append(max(0, remaining_percentage))
        random.shuffle(random_splits)

        for i in range(num_options):
            label = letters[i] if i < len(letters) else f"Option {i+1}"
            if i == correct_idx:
                votes[label] = correct_vote
            else:
                votes[label] = random_splits.pop(0) if random_splits else 10

        return LifelineResponse(
            type="audience-poll",
            question_id=req.question_id,
            audience_votes=votes,
            message="Audience votes tallied."
        )

    elif req.type == "time-freeze":
        return LifelineResponse(
            type="time-freeze",
            question_id=req.question_id,
            freeze_seconds=10,
            message="Timer frozen for 10 seconds."
        )

    else:
        raise HTTPException(status_code=400, detail=f"Unknown lifeline type '{req.type}'")
