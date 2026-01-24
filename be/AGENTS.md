# 3D Design Agent

FastAPI backend for an agentic 3D design system using OpenRouter.

## Structure
- `main.py` - FastAPI entry point
- `config/` - Settings and environment
- `models/` - Pydantic data models
- `tools/` - Agent tools (todo, mesh, verify, render, finalize)
- `ai/` - OpenRouter client and agent runner
- `routers/` - API endpoints
- `services/` - Business logic
- `prompt/` - System prompts

## Run
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

## API
- `POST /agent/start` - Start design session
- `POST /agent/{id}/message` - Send message
- `POST /agent/{id}/step` - Run one agent step
- `POST /agent/{id}/run` - Run until complete
- `GET /agent/{id}/state` - Get current state
- `GET /agent/{id}/mesh` - Get mesh data
- `GET /agent/{id}/mesh/obj` - Export OBJ format