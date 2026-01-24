from typing import Any
from .base import Tool
from models.agent import AgentState


class FinalizeTool(Tool):
    name = "finalize"
    description = "Mark the design as complete"
    parameters = {
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "Summary of the completed design",
            }
        },
    }

    def execute(self, state: AgentState, **kwargs) -> dict[str, Any]:
        state.finalized = True
        summary = kwargs.get("summary", "Design finalized")

        return {
            "success": True,
            "summary": summary,
            "final_stats": {
                "vertices": len(state.mesh.vertices),
                "edges": len(state.mesh.edges),
                "faces": len(state.mesh.faces),
            },
        }
