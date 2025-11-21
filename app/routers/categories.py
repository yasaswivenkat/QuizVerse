from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field
from app.database import get_all_categories_from_db, create_category_in_db, delete_category_from_db
from app.config import MODES

router = APIRouter(prefix="/api/categories", tags=["Categories (Dynamic)"])

class CategoryCreate(BaseModel):
    id: str = Field(..., min_length=2, max_length=40)
    name: str = Field(..., min_length=2, max_length=60)
    icon: str = Field("CAT", max_length=10)
    color: str = Field("#6366f1", max_length=20)
    description: str = Field(..., min_length=5, max_length=250)
    tags: List[str] = Field(default_factory=list)

@router.get("")
def list_categories():
    categories = get_all_categories_from_db()
    return {"categories": categories, "modes": MODES}

@router.post("")
def add_category(cat: CategoryCreate):
    try:
        created = create_category_in_db(cat.model_dump())
        return created
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not create category: {str(e)}")

@router.delete("/{cat_id}")
def remove_category(cat_id: str):
    success = delete_category_from_db(cat_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found or cannot be deleted")
    return {"status": "deleted", "id": cat_id}
