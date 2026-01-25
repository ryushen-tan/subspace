import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import agent_router
from routers import auth as auth_router

app = FastAPI(
    title="3D Design Agent API",
    description="Agentic backend for creating 3D low-poly designs",
    version="0.1.0",
)

# CORS configuration for local development
# In production, replace "*" with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production: ["http://localhost:5173", "https://yourdomain.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agent_router)
app.include_router(auth_router.router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "3D Design Agent"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
