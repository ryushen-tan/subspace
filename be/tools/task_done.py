from typing import Any
from .base import Tool
from models.agent import AgentState


class TaskDoneTool(Tool):
    name = "task_done"
    description = "Mark a task as completed by its index"
    parameters = {
        "type": "object",
        "properties": {
            "task_index": {
                "type": "integer",
                "description": "Index of the task to mark as done (0-based)",
            }
        },
        "required": ["task_index"],
    }

    def execute(self, state: AgentState, **kwargs) -> dict[str, Any]:
        task_index = kwargs.get("task_index", 0)
        if 0 <= task_index < len(state.todo):
            state.todo[task_index]["done"] = True
            # Auto-complete if all tasks are done and mesh exists
            if state.todo and all(t.get("done", False) for t in state.todo):
                if state.mesh.vertices:
                    state.task_complete = True
            return {"success": True, "task": state.todo[task_index]}
        return {"success": False, "error": "Invalid task index"}
