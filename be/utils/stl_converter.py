import numpy as np
import json
import sys
import os
from pathlib import Path

try:
    import cadquery as cq
    CADQUERY_AVAILABLE = True
except ImportError:
    CADQUERY_AVAILABLE = False


def step_to_stl(step_path: str, stl_path: str) -> dict:
    """
    Convert STEP file to STL file using CadQuery.
    
    Args:
        step_path: Path to input STEP file
        stl_path: Path to output STL file
    
    Returns:
        dict with "success" (bool) and optional "error" (str) keys
    """
    if not CADQUERY_AVAILABLE:
        return {"success": False, "error": "CadQuery is not available. Install cadquery and cadquery-ocp."}
    
    try:
        if not os.path.exists(step_path):
            return {"success": False, "error": f"STEP file not found: {step_path}"}
        
        # Load the STEP file
        part = cq.importers.importStep(step_path)
        
        # Get the underlying shape
        shape = part.val()
        
        # Export to STL
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(stl_path) if os.path.dirname(stl_path) else '.', exist_ok=True)
        
        # Export the shape to STL
        cq.exporters.export(shape, stl_path)
        
        if not os.path.exists(stl_path):
            return {"success": False, "error": "STL file was not created"}
        
        return {"success": True}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

def read_stl_binary(filepath):
    """Read binary STL file"""
    with open(filepath, 'rb') as f:
        # Skip 80-byte header
        f.read(80)
        # Read triangle count
        triangle_count = np.frombuffer(f.read(4), dtype=np.uint32)[0]
        
        
        vertices = []
        faces = []
        vertex_map = {}
        
        # Read each triangle
        for _ in range(triangle_count):
            # Skip normal vector (12 bytes)
            f.read(12)
            
            # Read 3 vertices (36 bytes total)
            v1 = tuple(np.frombuffer(f.read(12), dtype=np.float32))
            v2 = tuple(np.frombuffer(f.read(12), dtype=np.float32))
            v3 = tuple(np.frombuffer(f.read(12), dtype=np.float32))
            
            # Skip attribute byte count
            f.read(2)
            
            # Add vertices if not already present
            face = []
            for v in [v1, v2, v3]:
                # Round to 6 decimal places for deduplication
                key = (round(v[0], 6), round(v[1], 6), round(v[2], 6))
                
                if key not in vertex_map:
                    idx = len(vertices)
                    vertex_map[key] = idx
                    vertices.append({
                        "id": str(idx),
                        "p": [float(v[0]), float(v[1]), float(v[2])]
                    })
                
                face.append(str(vertex_map[key]))
            
            faces.append(face)
        
        return vertices, faces

def read_stl_ascii(filepath):
    """Read ASCII STL file"""
    vertices = []
    faces = []
    vertex_map = {}
    
    with open(filepath, 'r') as f:
        current_vertices = []
        
        for line in f:
            line = line.strip()
            
            if line.startswith('vertex'):
                coords = line.split()[1:]
                v = tuple(float(c) for c in coords)
                current_vertices.append(v)
            
            elif line.startswith('endfacet'):
                if len(current_vertices) == 3:
                    face = []
                    for v in current_vertices:
                        # Round to 6 decimal places for deduplication
                        key = (round(v[0], 6), round(v[1], 6), round(v[2], 6))
                        
                        if key not in vertex_map:
                            idx = len(vertices)
                            vertex_map[key] = idx
                            vertices.append({
                                "id": str(idx),
                                "p": [v[0], v[1], v[2]]
                            })
                        
                        face.append(str(vertex_map[key]))
                    
                    faces.append(face)
                
                current_vertices = []
    
    return vertices, faces

def stl_to_mesh(stl_path, source_name: str | None = None, simplify: bool = True, target_vertices: int = 100):
    """Convert STL file to mesh format"""
    try:
        # Determine if binary or ASCII
        with open(stl_path, 'rb') as f:
            header = f.read(5)
            is_ascii = header.startswith(b'solid')
        
        if is_ascii:
            vertices, faces = read_stl_ascii(stl_path)
        else:
            vertices, faces = read_stl_binary(stl_path)
        
        if not vertices:
            return {"error": "No vertices found in STL file"}
        
        # Calculate bounding box for scaling
        # Apply rotation: (x, y, z) -> (x, z, -y) to stand upright and face correct direction
        # This converts from Z-up to Y-up coordinate system
        coords = np.array([v["p"] for v in vertices])
        # Rotate coordinates: (x, y, z) -> (x, z, -y)
        rotated_coords = np.array([[c[0], c[2], -c[1]] for c in coords])
        min_coords = rotated_coords.min(axis=0)
        max_coords = rotated_coords.max(axis=0)
        
        center = (min_coords + max_coords) / 2
        dims = max_coords - min_coords
        max_dim = dims.max()
        
        # Target size is 10 units for the largest dimension
        target_size = 10.0
        scale_factor = 1.0
        if max_dim > 0:
            scale_factor = target_size / max_dim
        
        # Apply scaling and centering (rotation already applied to coords above)
        scaled_vertices = []
        for v in vertices:
            p = np.array(v["p"])
            # Apply rotation: (x, y, z) -> (x, z, -y)
            x, y, z = p[0], p[1], p[2]
            rotated_p = np.array([x, z, -y])
            scaled_p = (rotated_p - center) * scale_factor
            v["p"] = [float(x) for x in scaled_p]
            if source_name:
                v["source"] = source_name
            scaled_vertices.append(v)
        
        # Shift to ground plane: move all vertices so min Y = 0
        min_y = min(v["p"][1] for v in scaled_vertices)
        for v in scaled_vertices:
            v["p"][1] -= min_y
        
        result = {
            "vertices": scaled_vertices,
            "faces": faces,
            "edges": [],
            "scale_factor": scale_factor
        }
        
        # Apply simplification if needed
        if simplify and len(scaled_vertices) > target_vertices:
            from mesh_simplifier import simplify_mesh, get_simplified_description
            simplified = simplify_mesh(scaled_vertices, faces, target_vertices, source_name)
            result["simplified_vertices"] = simplified["vertices"]
            result["simplified_faces"] = simplified["faces"]
            result["summary"] = simplified["summary"]
            result["summary_text"] = get_simplified_description(simplified["summary"])
        else:
            from mesh_simplifier import generate_summary, get_simplified_description
            summary = generate_summary(scaled_vertices, faces, source_name)
            result["summary"] = summary
            result["summary_text"] = get_simplified_description(summary)
        
        return result
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)
    
    stl_path = sys.argv[1]
    if not os.path.exists(stl_path):
        print(json.dumps({"error": f"File not found: {stl_path}"}))
        sys.exit(1)
    
    source_name = os.path.basename(stl_path)
    result = stl_to_mesh(stl_path, source_name=source_name)
    print(json.dumps(result))
