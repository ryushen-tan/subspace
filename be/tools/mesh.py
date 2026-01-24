from typing import Any
from difflib import get_close_matches
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
        raw_vertices = kwargs.get("vertices", [])
        vertices = []
        skipped = []
        for i, v in enumerate(raw_vertices):
            if isinstance(v, dict) and "id" in v and "p" in v and isinstance(v["p"], list) and len(v["p"]) >= 3:
                vertices.append(Vertex(id=v["id"], p=tuple(v["p"][:3])))
            else:
                skipped.append({"index": i, "data": str(v)[:50]})
        
        if not vertices:
            return {"success": False, "error": "No valid vertices", "skipped": skipped, "hint": "Each vertex needs {id: string, p: [x, y, z]}"}
        vertex_ids = [v.id for v in vertices]
        vertex_id_set = set(vertex_ids)
        
        edges = [tuple(e) for e in kwargs.get("edges", [])]
        loops = kwargs.get("loops")
        stitch = [tuple(s) for s in kwargs.get("stitch", [])] if kwargs.get("stitch") else None

        # Auto-correct faces with fuzzy matching
        raw_faces = kwargs.get("faces", [])
        corrected_faces = []
        corrections = []
        
        for f in raw_faces:
            corrected_face = []
            for vid in f:
                if vid in vertex_id_set:
                    corrected_face.append(vid)
                else:
                    matches = get_close_matches(vid, vertex_ids, n=1, cutoff=0.5)
                    if matches:
                        corrected_face.append(matches[0])
                        corrections.append({"from": vid, "to": matches[0]})
                    else:
                        corrected_face.append(vid)
            corrected_faces.append(tuple(corrected_face))

        state.mesh = Mesh(
            vertices=vertices,
            edges=edges,
            faces=corrected_faces,
            loops=loops,
            stitch=stitch,
        )

        result = {
            "success": True,
            "vertex_count": len(vertices),
            "edge_count": len(edges),
            "face_count": len(corrected_faces),
        }
        if corrections:
            result["auto_corrections"] = corrections
        return result
