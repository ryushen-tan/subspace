from typing import Any
from .base import Tool
from models.agent import AgentState


class CreateTodoTool(Tool):
    name = "create_todo"
    description = "Create or update the task list for the current design"
    parameters = {
        "type": "object",
        "properties": {
            "tasks": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of tasks to complete",
            }
        },
        "required": ["tasks"],
    }

    def execute(self, state: AgentState, **kwargs) -> dict[str, Any]:
        tasks = kwargs.get("tasks", [])
        state.todo = tasks
        return {"success": True, "tasks": tasks}
