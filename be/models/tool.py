from pydantic import BaseModel
from typing import Any, Optional


class ToolCall(BaseModel):
    type: str = "tool"
    id: str
    name: str
    arguments: dict[str, Any] = {}


class ToolResponse(BaseModel):
    type: str = "tool_response"
    id: str
    result: Optional[Any] = None
    error: Optional[str] = None
