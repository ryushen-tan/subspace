import numpy as np
from typing import Any
from collections import defaultdict


def simplify_mesh(vertices: list[dict], faces: list[list[str]], 
                  target_vertices: int = 100, source: str | None = None) -> dict:
    """
    Simplify mesh by voxel-based vertex clustering.
    Returns simplified vertices, faces, and a summary for the agent.
    """
    if len(vertices) <= target_vertices:
        # Add source to vertices if provided
        if source:
            for v in vertices:
                v["source"] = source
        return {
            "vertices": vertices,
            "faces": faces,
            "simplified": False,
            "summary": generate_summary(vertices, faces, source)
        }
    
    coords = np.array([v["p"] for v in vertices])
    
    # Calculate bounding box
    min_coords = coords.min(axis=0)
    max_coords = coords.max(axis=0)
    dims = max_coords - min_coords
    
    # Determine voxel size to achieve target vertex count
    volume = np.prod(dims) if np.prod(dims) > 0 else 1
    voxel_size = (volume / target_vertices) ** (1/3)
    voxel_size = max(voxel_size, 0.01)  # Minimum voxel size
    
    # Cluster vertices into voxels
    voxel_map = defaultdict(list)
    for i, coord in enumerate(coords):
        voxel_key = tuple(((coord - min_coords) / voxel_size).astype(int))
        voxel_map[voxel_key].append(i)
    
    # Create new vertices at voxel centers
    old_to_new = {}
    new_vertices = []
    
    for voxel_key, indices in voxel_map.items():
        new_idx = len(new_vertices)
        centroid = coords[indices].mean(axis=0)
        
        new_vertices.append({
            "id": f"s{new_idx}",
            "p": [float(centroid[0]), float(centroid[1]), float(centroid[2])],
            "source": source
        })
        
        for old_idx in indices:
            old_to_new[str(old_idx)] = f"s{new_idx}"
            # Also map by original vertex id
            old_to_new[vertices[old_idx]["id"]] = f"s{new_idx}"
    
    # Remap faces and remove degenerate ones
    new_faces = []
    seen_faces = set()
    
    for face in faces:
        new_face = []
        for vid in face:
            new_vid = old_to_new.get(vid, vid)
            new_face.append(new_vid)
        
        # Remove duplicate vertices in face
        unique_face = []
        for v in new_face:
            if not unique_face or unique_face[-1] != v:
                unique_face.append(v)
        if unique_face and unique_face[0] == unique_face[-1]:
            unique_face = unique_face[:-1]
        
        # Skip degenerate faces (less than 3 unique vertices)
        if len(unique_face) >= 3:
            face_key = tuple(sorted(unique_face))
            if face_key not in seen_faces:
                seen_faces.add(face_key)
                new_faces.append(unique_face)
    
    return {
        "vertices": new_vertices,
        "faces": new_faces,
        "simplified": True,
        "original_vertex_count": len(vertices),
        "original_face_count": len(faces),
        "summary": generate_summary(new_vertices, new_faces, source)
    }


def generate_summary(vertices: list[dict], faces: list[list[str]], source: str | None = None) -> dict:
    """Generate a summary of the mesh for agent context."""
    if not vertices:
        return {"error": "No vertices"}
    
    coords = np.array([v["p"] for v in vertices])
    min_coords = coords.min(axis=0)
    max_coords = coords.max(axis=0)
    center = (min_coords + max_coords) / 2
    dims = max_coords - min_coords
    
    # Find corner/extreme vertices
    key_points = []
    
    # Add bounding box corners that have nearby vertices
    corners = [
        ("min_corner", min_coords),
        ("max_corner", max_coords),
        ("center", center),
    ]
    
    # Find vertices closest to extremes on each axis
    for axis, name in enumerate(["x", "y", "z"]):
        min_idx = coords[:, axis].argmin()
        max_idx = coords[:, axis].argmax()
        key_points.append({
            "name": f"{name}_min",
            "position": [float(x) for x in coords[min_idx]],
            "vertex_id": vertices[min_idx]["id"]
        })
        key_points.append({
            "name": f"{name}_max", 
            "position": [float(x) for x in coords[max_idx]],
            "vertex_id": vertices[max_idx]["id"]
        })
    
    # Determine approximate shape
    sorted_dims = sorted(dims)
    if sorted_dims[0] < 0.1 * sorted_dims[2]:
        shape_type = "flat/planar"
    elif sorted_dims[0] > 0.7 * sorted_dims[2]:
        shape_type = "cubic/spherical"
    else:
        shape_type = "elongated"
    
    return {
        "source": source,
        "vertex_count": len(vertices),
        "face_count": len(faces),
        "bounding_box": {
            "min": [float(x) for x in min_coords],
            "max": [float(x) for x in max_coords],
            "center": [float(x) for x in center],
            "dimensions": [float(x) for x in dims]
        },
        "shape_type": shape_type,
        "key_points": key_points
    }


def get_simplified_description(summary: dict) -> str:
    """Convert summary to human-readable description for the agent."""
    if "error" in summary:
        return summary["error"]
    
    bb = summary["bounding_box"]
    source = summary.get("source", "uploaded mesh")
    
    desc = f"Object '{source}': {summary['vertex_count']} vertices, {summary['face_count']} faces. "
    desc += f"Bounding box: {bb['dimensions'][0]:.2f} x {bb['dimensions'][1]:.2f} x {bb['dimensions'][2]:.2f} units. "
    desc += f"Center at ({bb['center'][0]:.2f}, {bb['center'][1]:.2f}, {bb['center'][2]:.2f}). "
    desc += f"Shape: {summary['shape_type']}. "
    
    # Add key points
    desc += "Key points: "
    for kp in summary["key_points"][:4]:  # Limit to avoid too much text
        desc += f"{kp['name']}=({kp['position'][0]:.2f},{kp['position'][1]:.2f},{kp['position'][2]:.2f}), "
    
    return desc.rstrip(", ")
