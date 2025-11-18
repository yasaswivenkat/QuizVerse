from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.config import APP_NAME, APP_VERSION, APP_DESCRIPTION, BASE_DIR
from app.database import init_db
from app.routers import (
    quiz, lifelines, daily, leaderboard,
    custom_quiz, stats, categories, questions,
    users, generate, battle_ws
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=APP_DESCRIPTION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(quiz.router)
app.include_router(lifelines.router)
app.include_router(daily.router)
app.include_router(leaderboard.router)
app.include_router(custom_quiz.router)
app.include_router(stats.router)
app.include_router(categories.router)
app.include_router(questions.router)
app.include_router(users.router)
app.include_router(generate.router)
app.include_router(battle_ws.router)

static_dir = BASE_DIR / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.get("/", include_in_schema=False)
async def serve_index():
    index_file = static_dir / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "Welcome to QuizVerse API. Visit /docs for OpenAPI documentation."}

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "app": APP_NAME,
        "version": APP_VERSION,
        "architecture": "fully-dynamic-relational"
    }
