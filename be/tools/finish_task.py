from typing import Any
from .base import Tool
from models.agent import AgentState


class FinishTaskTool(Tool):
    name = "finish_task"
    description = "Call this when you have completed the user's request and have no more actions to take"
    parameters = {
        "type": "object",
        "properties": {
            "message": {
                "type": "string",
                "description": "Summary message for the user",
            }
        },
        "required": ["message"],
    }

    def execute(self, state: AgentState, **kwargs) -> dict[str, Any]:
        state.task_complete = True
        return {"success": True, "message": kwargs.get("message", "Task complete")}
