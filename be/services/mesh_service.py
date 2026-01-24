from models.mesh import Mesh


class MeshService:
    @staticmethod
    def validate(mesh: Mesh) -> dict:
        errors = []
        warnings = []
        vertex_ids = {v.id for v in mesh.vertices}

        for edge in mesh.edges:
            for vid in edge:
                if vid not in vertex_ids:
                    errors.append(f"Edge references unknown vertex: {vid}")

        for i, face in enumerate(mesh.faces):
            if len(face) < 3:
                errors.append(f"Face {i} has fewer than 3 vertices")
            if len(face) != len(set(face)):
                errors.append(f"Face {i} is degenerate")
            for vid in face:
                if vid not in vertex_ids:
                    errors.append(f"Face {i} references unknown vertex: {vid}")

        return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}

    @staticmethod
    def export_obj(mesh: Mesh) -> str:
        lines = ["# Generated mesh"]
        id_to_idx = {}

        for i, v in enumerate(mesh.vertices, 1):
            id_to_idx[v.id] = i
            lines.append(f"v {v.p[0]} {v.p[1]} {v.p[2]}")

        for face in mesh.faces:
            indices = [str(id_to_idx[vid]) for vid in face if vid in id_to_idx]
            if len(indices) >= 3:
                lines.append(f"f {' '.join(indices)}")

        return "\n".join(lines)
