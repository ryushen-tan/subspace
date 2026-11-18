# polyspace backend

FastAPI service that runs the LLM design agent. The agent builds and edits low-poly meshes by calling tools, and streams its progress to the frontend over a WebSocket.

## Layout

- `main.py`: FastAPI entry point
- `config/`: settings loaded from `.env`
- `ai/`: OpenRouter and Gemini clients and the agent loop
- `tools/`: agent tools (todo, mesh, inspect, render, verify, finalize, photo)
- `services/`: mesh handling, STEP analysis, photo-to-3D, preview generation
- `utils/`: mesh simplification, rendering, STEP/STL conversion
- `routers/`: HTTP and WebSocket endpoints
- `prompt/`: system prompts
- `tests/`: unit tests

## Run

```bash
python3.11 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

The agent is created on startup, so `.env` needs a key for the provider selected by `LLM_PROVIDER`. Health check: `GET /health`.

## Test

```bash
pip install pytest
pytest tests
```

## API

- `POST /agent/start`: start a design session
- `POST /agent/{id}/message`: send a message
- `POST /agent/{id}/step`: run one agent step
- `POST /agent/{id}/run`: run until complete
- `GET /agent/{id}/state`: current session state
- `GET /agent/{id}/mesh`: mesh data
- `GET /agent/{id}/mesh/obj`: export as OBJ
- `POST /agent/upload-step`, `/agent/upload-stl`, `/agent/upload-photo`: import existing geometry
- `POST /agent/generate-preview`: scene preview
- `WS /agent/ws`: streaming agent session
