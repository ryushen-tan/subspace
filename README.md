# subspace - Monorepo Setup

This repo contains:
- Backend (FastAPI) in [be](be)
- Frontend (React + Vite) in [fe](fe)

Follow these steps on macOS to install dependencies and run everything locally.

## Prerequisites
- Homebrew (https://brew.sh)
- Python 3.11
- Node.js (18+ recommended)
- PocketBase

## Environment Variables
Set up environment files for Backend and Frontend:

### Backend (`be/.env`)
Copy the example file and update secrets (OpenRouter and ElevenLabs only):
```bash
cd ./be
cp .env.example .env
```
Keys you may need:
- `openrouter_api_key` (backend only; do NOT put in frontend)
- `VITE_ELEVENLABS_API_KEY`

The backend automatically loads variables from `be/.env` (via Pydantic Settings).

### Frontend (`fe/.env`)
Copy the example file and update values (ElevenLabs only):
```bash
cd ./fe
cp .env.example .env
```
Variables are exposed only if prefixed with `VITE_`:
- `VITE_ELEVENLABS_API_KEY`

Note: The OpenRouter API key is used by the backend only and should not be present in `fe/.env`.

Do not commit `.env` files with secrets.

### Install prerequisites
```bash
# Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Python 3.11
brew install python@3.11
# (Optional) Add Python 3.11 to PATH in your shell profile if needed
# echo 'export PATH="/opt/homebrew/opt/python@3.11/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc

# Node.js
brew install node

# PocketBase
brew install pocketbase
```

## Quick Start (All Services)
Run these in separate terminals:

### 1) Start PocketBase
Run from the repo root so it uses the local [pb_data](pb_data) folder for storage.
```bash
pocketbase serve
```
- Web Admin UI: http://127.0.0.1:8090/_/
- API: http://127.0.0.1:8090

### 2) Start Backend (FastAPI)
The backend app is defined in [be/main.py](be/main.py) with the FastAPI instance `app`.
```bash
cd ./be

# Option A: Use the provided setup script (Python 3.11 required)
./setup_venv.sh

# Activate the venv (if not already active)
source venv/bin/activate

# Option A1: Run with auto-reload via uvicorn
uvicorn main:app --reload --port 8000

# Option A2: Or run directly (no auto-reload)
python main.py
```
- Backend runs at: http://localhost:8000
- Healthcheck: http://localhost:8000/health

### 3) Start Frontend (React + Vite)
```bash
cd ./fe
npm install
npm run dev
```
- Frontend dev server: http://localhost:5173

## Configuration Notes
- CORS is currently permissive in [be/main.py](be/main.py) and allows all origins for local dev.
- The frontend’s agent API client defaults to `http://localhost:8000` and `ws://localhost:8000` (see [fe/src/services/agentApi.js](fe/src/services/agentApi.js)). No `.env` variables are required for the API in the current setup.
- PocketBase uses the local [pb_data](pb_data) directory when you run `pocketbase serve` from the repo root.

## Typical Development Workflow
- Start PocketBase first, then Backend, then Frontend.
- Make backend changes and use `uvicorn --reload` for fast iteration.
- Refresh the frontend to pick up API responses.

## Common Issues & Fixes
- Python 3.11 not found:
  - Use the full path: `/opt/homebrew/opt/python@3.11/bin/python3.11`
  - Or add it to your PATH (see the comment under prerequisites).
- `vite` or dev server not found:
  - Run `npm install` inside [fe](fe).
- `pocketbase` command not found:
  - Run `brew install pocketbase` again, or download the binary from https://pocketbase.io/ and place it in your PATH.
- Port conflicts:
  - Backend: change with `uvicorn main:app --port 8001`
  - Frontend: change with `npm run dev -- --port 5174`
  - PocketBase: `pocketbase serve --http 127.0.0.1:8091`

## Project Structure
- Backend code: [be](be)
- Frontend code: [fe](fe)
- Local database storage: [pb_data](pb_data)

## Helpful Commands
```bash
# Backend
cd be && source venv/bin/activate && uvicorn main:app --reload --port 8000

# Frontend
cd fe && npm run dev

# PocketBase (from repo root)
pocketbase serve
```

## Requirements
Backend Python packages are listed in [be/requirements.txt](be/requirements.txt). The `./setup_venv.sh` script installs them automatically when run.

---
With all three services running:
- Frontend at http://localhost:5173 connects to Backend at http://localhost:8000
- PocketBase admin at http://127.0.0.1:8090/_/ for inspecting data
