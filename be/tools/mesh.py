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
        # Preserve existing mesh data (e.g., uploaded STL/STEP)
        existing_vertices = list(state.mesh.vertices) if state.mesh else []
        existing_edges = list(state.mesh.edges) if state.mesh else []
        existing_faces = list(state.mesh.faces) if state.mesh else []
        existing_ids = {v.id for v in existing_vertices}
        
        raw_vertices = kwargs.get("vertices", [])
        vertices = []
        skipped = []
        for i, v in enumerate(raw_vertices):
            if isinstance(v, dict) and "id" in v and "p" in v and isinstance(v["p"], list) and len(v["p"]) >= 3:
                vid = v["id"]
                # Prefix ID if it conflicts with existing
                if vid in existing_ids:
                    vid = f"new_{vid}"
                vertices.append(Vertex(id=vid, p=tuple(v["p"][:3])))
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

        # Merge with existing mesh data
        state.mesh = Mesh(
            vertices=existing_vertices + vertices,
            edges=existing_edges + edges,
            faces=existing_faces + corrected_faces,
            loops=loops,
            stitch=stitch,
        )

        result = {
            "success": True,
            "vertex_count": len(state.mesh.vertices),
            "edge_count": len(state.mesh.edges),
            "face_count": len(state.mesh.faces),
            "new_vertices": len(vertices),
            "preserved_vertices": len(existing_vertices),
        }
        if corrections:
            result["auto_corrections"] = corrections
        
        # Auto-complete if all tasks are done (safety check)
        if state.todo and all(t.get("done", False) for t in state.todo):
            state.task_complete = True
            result["message"] = "Mesh submitted. All tasks complete. Generation stopped."
        
        return result
