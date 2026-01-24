from typing import Any
from .base import Tool
from models.agent import AgentState


class VerifyMeshTool(Tool):
    name = "verify_mesh"
    description = "Validate the current mesh structure for errors"
    parameters = {
        "type": "object",
        "properties": {},
    }

    def execute(self, state: AgentState, **kwargs) -> dict[str, Any]:
        mesh = state.mesh
        errors = []
        warnings = []

        vertex_ids = {v.id for v in mesh.vertices}

        if not mesh.vertices:
            errors.append("No vertices defined")
            return {"valid": False, "errors": errors, "warnings": warnings}

        for edge in mesh.edges:
            for vid in edge:
                if vid not in vertex_ids:
                    errors.append(f"Edge references unknown vertex: {vid}")

        for i, face in enumerate(mesh.faces):
            if len(face) < 3:
                errors.append(f"Face {i} has fewer than 3 vertices")
            if len(face) != len(set(face)):
                errors.append(f"Face {i} has duplicate vertices (degenerate)")
            for vid in face:
                if vid not in vertex_ids:
                    errors.append(f"Face {i} references unknown vertex: {vid}")

        if not mesh.faces and not mesh.edges:
            warnings.append("No faces or edges defined - mesh has only points")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "stats": {
                "vertices": len(mesh.vertices),
                "edges": len(mesh.edges),
                "faces": len(mesh.faces),
            },
        }
