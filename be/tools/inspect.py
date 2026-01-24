from typing import Any
from .base import Tool
from models.agent import AgentState
import numpy as np


class InspectMeshTool(Tool):
    name = "inspect_mesh"
    description = "Inspect the current mesh to see its structure, vertices, faces, and get information about what the object looks like. Use this when the user asks about an uploaded file or what the current mesh represents."
    parameters = {
        "type": "object",
        "properties": {
            "detail_level": {
                "type": "string",
                "enum": ["summary", "detailed"],
                "description": "Level of detail: 'summary' for basic stats, 'detailed' for vertex/face information",
                "default": "summary"
            }
        },
    }

    def execute(self, state: AgentState, **kwargs) -> dict[str, Any]:
        mesh = state.mesh
        detail_level = kwargs.get("detail_level", "summary")
        
        if not mesh.vertices:
            return {
                "has_mesh": False,
                "message": "No mesh is currently loaded. The user may need to upload a file first."
            }
        
        # Calculate bounding box and dimensions
        vertices_array = np.array([v.p for v in mesh.vertices])
        min_coords = vertices_array.min(axis=0)
        max_coords = vertices_array.max(axis=0)
        center = (min_coords + max_coords) / 2
        dimensions = max_coords - min_coords
        
        result = {
            "has_mesh": True,
            "stats": {
                "vertex_count": len(mesh.vertices),
                "face_count": len(mesh.faces),
                "edge_count": len(mesh.edges),
            },
            "bounds": {
                "min": min_coords.tolist(),
                "max": max_coords.tolist(),
                "center": center.tolist(),
                "dimensions": dimensions.tolist(),
            },
        }
        
        if detail_level == "detailed":
            # Include sample vertices and faces
            sample_vertices = mesh.vertices[:20]  # First 20 vertices
            sample_faces = mesh.faces[:20]  # First 20 faces
            
            result["sample_vertices"] = [
                {"id": v.id, "position": list(v.p)} for v in sample_vertices
            ]
            result["sample_faces"] = [list(f) for f in sample_faces]
            
            if len(mesh.vertices) > 20:
                result["note"] = f"Showing first 20 of {len(mesh.vertices)} vertices"
            if len(mesh.faces) > 20:
                result["note"] = f"Showing first 20 of {len(mesh.faces)} faces"
        
        # Add helpful description hints
        if mesh.faces:
            result["description_hint"] = "This mesh has faces, so it represents a solid 3D object with surfaces."
        elif mesh.edges:
            result["description_hint"] = "This mesh has edges but no faces, so it may be a wireframe or outline."
        else:
            result["description_hint"] = "This mesh contains only vertices (points), with no faces or edges defined."
        
        return result
