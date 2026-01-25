from pydantic import BaseModel, Field
from typing import Any
from .mesh import Mesh


class AgentState(BaseModel):
    mesh: Mesh = Field(default_factory=Mesh)
    todo: list[dict] = Field(default_factory=list)  # [{"text": "task", "done": False}, ...]
    iteration: int = 0
    finalized: bool = False
    task_complete: bool = False


class Session(BaseModel):
    id: str
    state: AgentState = Field(default_factory=AgentState)
    history: list[dict[str, Any]] = Field(default_factory=list)
    user_prompt: str = ""
