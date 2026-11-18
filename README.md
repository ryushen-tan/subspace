# polyspace

Low-poly 3D CAD generation from natural language. Describe an object, and an LLM agent builds and refines a low-poly mesh you can orbit, edit, and export in the browser.

## Features

- **Agentic modelling:** the agent plans with a todo list, edits the mesh through tool calls, renders its own work, and verifies the result before finishing.
- **Import existing geometry:** upload STEP or STL files and the agent analyses and simplifies them to a low-poly mesh.
- **Photo to 3D:** upload a photo of an object on paper to generate a starting model.
- **Interactive editor:** React Three Fiber scene with draggable points, transform controls, a view cube, a timeline, and unit toggling.
- **Voice input:** optional speech-to-text through ElevenLabs.
- **Accounts and projects:** PocketBase handles auth and a per-user project library.

## Architecture

| Part | Stack | Path |
| --- | --- | --- |
| Frontend | React, Vite, Tailwind, React Three Fiber, Zustand | [fe](fe) |
| Backend | FastAPI, trimesh, OpenRouter or Gemini | [be](be) |
| Auth and storage | PocketBase | [docs](docs/pocketbase-schema.md) |

## Getting started

Prerequisites: Python 3.11, Node.js 18+, and [PocketBase](https://pocketbase.io/docs/).

### 1. PocketBase

```bash
pocketbase serve
```

Open http://127.0.0.1:8090/_/, create an admin account, then create the collections described in [docs/pocketbase-schema.md](docs/pocketbase-schema.md) (`tier` field on `users`, and a `projects` collection).

### 2. Backend

```bash
cd be
python3.11 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Set `LLM_PROVIDER` to `openrouter` or `gemini` in `be/.env` and add the matching API key. The backend will not start without one.

### 3. Frontend

```bash
cd fe
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173.

## Configuration

| File | Variable | Purpose |
| --- | --- | --- |
| `be/.env` | `LLM_PROVIDER` | `openrouter` or `gemini` |
| `be/.env` | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | OpenRouter credentials and model |
| `be/.env` | `GEMINI_API_KEY`, `GEMINI_MODEL` | Gemini credentials and model |
| `be/.env` | `POCKETBASE_URL` | Used to verify user tokens |
| `fe/.env` | `VITE_API_URL` | Backend URL, defaults to `http://localhost:8000` |
| `fe/.env` | `VITE_POCKETBASE_URL` | PocketBase URL, defaults to `http://127.0.0.1:8090` |
| `fe/.env` | `VITE_ELEVENLABS_API_KEY` | Optional voice input |

`VITE_` variables are bundled into the browser build, so only use a restricted ElevenLabs key. Never commit `.env` files.

The backend allows all CORS origins by default; restrict `allow_origins` in [be/main.py](be/main.py) before deploying.

## Sample models

[sample_models](sample_models) has a bracket and a square in STEP and Fusion 360 formats for trying the import flow.

## Contributing

Issues and pull requests are welcome.

```bash
cd be && pytest tests
cd fe && npm run lint && npm run build
```

## License

[MIT](LICENSE)
