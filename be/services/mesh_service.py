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

        # Rescale back to original size if scale_factor is present
        inv_scale = 1.0 / mesh.scale_factor if mesh.scale_factor != 0 else 1.0

        for i, v in enumerate(mesh.vertices, 1):
            id_to_idx[v.id] = i
            lines.append(f"v {v.p[0] * inv_scale} {v.p[1] * inv_scale} {v.p[2] * inv_scale}")

        # Triangulate faces for compatibility with 3D applications
        for face in mesh.faces:
            indices = [id_to_idx[vid] for vid in face if vid in id_to_idx]
            if len(indices) < 3:
                continue
            elif len(indices) == 3:
                # Already a triangle
                lines.append(f"f {indices[0]} {indices[1]} {indices[2]}")
            elif len(indices) == 4:
                # Quad - split into two triangles
                lines.append(f"f {indices[0]} {indices[1]} {indices[2]}")
                lines.append(f"f {indices[0]} {indices[2]} {indices[3]}")
            else:
                # Polygon with 5+ vertices - fan triangulation
                for i in range(1, len(indices) - 1):
                    lines.append(f"f {indices[0]} {indices[i]} {indices[i + 1]}")

        return "\n".join(lines)
