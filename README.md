# QuizVerse

QuizVerse is a dynamic quiz platform built with a high-performance FastAPI backend, a relational SQLite database and a responsive vanilla JavaScript frontend.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Quickstart Guide](#quickstart-guide)
- [API Reference](#api-reference)
- [License](#license)

---

## Overview

Unlike standard static quiz websites that rely on fixed JSON files or hardcoded HTML questions, QuizVerse is completely dynamic and database-driven:

- **Database-Driven**: Questions, categories, user profiles, match statistics and leaderboards are stored in a relational SQLite database (`quizverse.db`).
- **Interactive Database Hub**: Manage the question bank directly through the web UI. You can view, search, create, update and delete questions and categories on the fly.
- **On-Demand Topic Generator**: Enter any custom topic, the system dynamically generates and seeds new questions into the database.
- **Real-Time Multiplayer**: Challenge other players in live rooms over WebSockets with synchronized scoring and question progression.
- **AI Rival Mode**: Duel against CyberSage-9000, an intelligent bot that computes answers in real time with human-like timing and banter.
- **Built-in Sound and Visuals**: Uses the browser Web Audio API for sound effects and HTML5 Canvas for completion certificates.

---

## Key Features

### Game Modes
- **Classic Quest**: Traditional quiz mode with customizable categories and difficulty levels (Easy, Medium, Hard).
- **Survival Mode**: 3 lives total. Each incorrect answer costs a heart. Test how long you can maintain a streak.
- **Time Blitz**: Fast-paced 60-second challenge where correct answers award bonus time and mistakes deduct seconds.
- **AI Rival Arena**: Live 1-on-1 battle against an AI opponent with real-time scoring and reaction dialogue.

### Lifelines
- **50:50**: Strips away two incorrect answer choices.
- **Oracle Clue**: Displays a helpful hint without directly giving away the solution.
- **Audience Poll**: Generates statistical vote percentages across all four options.
- **Chrono Freeze**: Freezes the countdown timer for 10 seconds to allow careful thinking.

### Custom Quiz Studio
- Create personalized quizzes with custom questions and code snippets.
- Automatically generates a unique 6-character share code (e.g., `QV-8492`) that other players can use to launch your quiz immediately.

### Progression and Daily Challenges
- **XP and Leveling**: Earn experience points for every correct answer and level up your profile.
- **Achievement Badges**: Unlock badges for specific milestones such as accuracy streaks, speedruns, and lifeline mastery.
- **Daily Challenge**: A fresh 5-question set every day to build and maintain a daily login streak.
- **Certificates**: Download high-resolution PNG completion certificates generated client-side via HTML5 Canvas.

### Themes and Audio
- **4 Visual Themes**: Switch between Obsidian (Dark), Cyberpunk (Neon), Emerald (Green), and Daylight (Light).
- **Synthesized Audio Engine**: Polyphonic sound effects (correct, wrong, click, level up, victory) produced mathematically using Web Audio oscillators.

---

## System Architecture

QuizVerse follows a clean, decoupled client-server architecture:

```text
[ Browser Client ]
  ├── Single-Page Application (HTML5, CSS3, Vanilla ES6+ JS)
  ├── Procedural Audio Synthesizer (Web Audio API)
  └── Certificate Renderer (HTML5 Canvas)
           │
           │  HTTP REST (JSON) / WebSocket
           ▼
[ FastAPI Backend ]
  ├── Router Layer (Quiz, Questions, Categories, Battles, Lifelines, Daily)
  ├── Game Engine & Validation (Scoring, Leveling, Topic Synthesis)
  └── WebSocket Connection Manager (Real-time duel broadcasting)
           │
           │  SQLite3 Engine
           ▼
[ SQLite Database ]
  └── quizverse.db (Categories, Questions, Users, Match History, Leaderboard)
```

---

## Project Structure

```text
QuizVerse/
├── app/
│   ├── main.py                  # FastAPI application entry point
│   ├── config.py                # App configuration, difficulty multipliers, and badges
│   ├── database.py              # SQLite connection, schema setup, and CRUD operations
│   ├── models.py                # Pydantic data validation schemas
│   ├── data/
│   │   ├── seed_questions.json  # Default question bank (60+ questions across 6 categories)
│   │   └── badges.json          # Achievement badge definitions
│   ├── routers/
│   │   ├── battle_ws.py         # Real-time WebSocket battle rooms
│   │   ├── categories.py        # Category management endpoints
│   │   ├── custom_quiz.py       # Custom quiz creation and retrieval
│   │   ├── daily.py             # Daily challenge endpoints and streak tracking
│   │   ├── generate.py          # Dynamic topic question synthesizer
│   │   ├── leaderboard.py       # Global leaderboard rankings and score submissions
│   │   ├── lifelines.py         # Lifeline calculations (50:50, poll, hint)
│   │   ├── questions.py         # Question CRUD endpoints
│   │   ├── quiz.py              # Quiz session lifecycle and answer verification
│   │   ├── stats.py             # User stats and badge unlocking logic
│   │   └── users.py             # User profile endpoints and match history
│   └── tests/
│       └── test_api.py          # Integration test suite covering all endpoints
│
├── static/
│   ├── index.html               # Main single-page web interface
│   ├── css/
│   │   ├── variables.css        # Color tokens, typography, and theme definitions
│   │   ├── base.css             # Base reset, layout grid, and header styles
│   │   ├── components.css       # Modals, HUD, buttons, cards, and tables
│   │   ├── animations.css       # Transition keyframes and micro-interactions
│   │   └── responsive.css       # Responsive breakpoints for mobile, tablet, and desktop
│   └── js/
│       ├── api.js               # Centralized HTTP API client
│       ├── app.js               # Application state machine and DOM controller
│       ├── audio.js             # Web Audio API sound synthesizer
│       ├── storage.js           # LocalStorage wrapper for client preferences
│       ├── confetti.js          # Canvas particle celebration effect
│       ├── certificate.js       # HTML5 Canvas certificate generator
│       └── ai_rival.js          # AI opponent bot decision engine and dialogue
│
├── run.py                       # One-click startup script with port and dependency checks
├── requirements.txt             # Project dependencies
├── LICENSE                      # MIT License
└── README.md                    # Project documentation
```

---

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, Uvicorn, SQLite3, Pydantic
- **Frontend**: HTML5, Vanilla CSS3, JavaScript (ES6+), Web Audio API, HTML5 Canvas
- **Real-Time**: WebSockets (FastAPI WebSocket endpoints)
- **Testing**: Pytest, HTTPX

---

## Quickstart Guide

### 1. Clone the Repository

```bash
git clone https://github.com/yasaswivenkat/QuizVerse.git
cd QuizVerse
```

### 2. Set Up a Virtual Environment

**Windows (PowerShell)**:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Windows (Command Prompt)**:
```cmd
python -m venv .venv
.\.venv\Scripts\activate.bat
```

**macOS / Linux**:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the Application

```bash
python run.py
```

The startup script will initialize the SQLite database (`quizverse.db`) automatically if it does not already exist, verify package dependencies, and launch the Uvicorn web server.

### 5. Access the Web App

- **Main Application**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive API Documentation (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative API Documentation (ReDoc)**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## API Reference

The backend provides a comprehensive REST API and WebSocket interface:

| Endpoint Group | Route | Description |
| :--- | :--- | :--- |
| **Questions Retrieval** | `GET /api/quiz/questions` | Fetch questions filtered by category, difficulty, and mode |
| **Answer Evaluation** | `POST /api/quiz/evaluate` | Evaluate submitted answer, calculate score delta, streak, and XP |
| **Questions Management** | `GET /api/questions` | Search, filter, and paginate question records |
| **Categories Management** | `GET /api/categories` | Retrieve all active knowledge realms and question counts |
| **Lifelines** | `POST /api/lifelines/use` | Calculate strategic lifeline result (50:50, Oracle Hint, Audience Poll) |
| **Topic Generator** | `POST /api/generate` | Synthesize and save dynamic questions on any custom subject |
| **Multiplayer Arena** | `WS /ws/battle/{room_id}` | Real-time WebSocket connection for live 2-player battles |
| **Daily Challenge**| `GET /api/daily` | Fetch the current day's curated 5-question challenge |
| **Leaderboard** | `GET /api/leaderboard` | Get global rankings by score or accuracy |
| **Custom Quizzes** | `POST /api/custom-quiz` | Save user-created quiz and generate a unique share code |
| **Game Sessions** | `POST /api/users/sessions` | Record match history, accuracy, and user leveling stats |

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
