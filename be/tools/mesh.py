from typing import Any
from .base import Tool
from models.agent import AgentState
from models.mesh import Vertex, Mesh


class SubmitMeshTool(Tool):
    name = "submit_mesh"
    description = "Submit vertices, edges, and faces for the 3D mesh"
    parameters = {
        "type": "object",
        "properties": {
            "vertices": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "p": {"type": "array", "items": {"type": "number"}},
                    },
                },
                "description": "List of vertices with id and position",
            },
            "edges": {
                "type": "array",
                "items": {"type": "array", "items": {"type": "string"}},
                "description": "List of edges as [vertex_id_1, vertex_id_2]",
            },
            "faces": {
                "type": "array",
                "items": {"type": "array", "items": {"type": "string"}},
                "description": "List of faces as arrays of vertex ids",
            },
            "loops": {
                "type": "object",
                "description": "Named loops for lofting",
            },
            "stitch": {
                "type": "array",
                "items": {"type": "array", "items": {"type": "string"}},
                "description": "Pairs of loop names to stitch together",
            },
        },
        "required": ["vertices"],
    }

    def execute(self, state: AgentState, **kwargs) -> dict[str, Any]:
        vertices = [Vertex(id=v["id"], p=tuple(v["p"])) for v in kwargs.get("vertices", [])]
        edges = [tuple(e) for e in kwargs.get("edges", [])]
        faces = [tuple(f) for f in kwargs.get("faces", [])]
        loops = kwargs.get("loops")
        stitch = [tuple(s) for s in kwargs.get("stitch", [])] if kwargs.get("stitch") else None

        state.mesh = Mesh(
            vertices=vertices,
            edges=edges,
            faces=faces,
            loops=loops,
            stitch=stitch,
        )

        return {
            "success": True,
            "vertex_count": len(vertices),
            "edge_count": len(edges),
            "face_count": len(faces),
        }
