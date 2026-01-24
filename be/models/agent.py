from pydantic import BaseModel
from typing import Any
from .mesh import Mesh


class AgentState(BaseModel):
    mesh: Mesh = Mesh()
    todo: list[str] = []
    iteration: int = 0
    finalized: bool = False


class Session(BaseModel):
    id: str
    state: AgentState = AgentState()
    history: list[dict[str, Any]] = []
    user_prompt: str = ""
