import numpy as np
import json
import sys
import os
from pathlib import Path

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

def stl_to_mesh(stl_path):
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
        coords = np.array([v["p"] for v in vertices])
        min_coords = coords.min(axis=0)
        max_coords = coords.max(axis=0)
        
        center = (min_coords + max_coords) / 2
        dims = max_coords - min_coords
        max_dim = dims.max()
        
        # Target size is 10 units for the largest dimension
        target_size = 10.0
        scale_factor = 1.0
        if max_dim > 0:
            scale_factor = target_size / max_dim
        
        # Apply scaling and centering
        scaled_vertices = []
        for v in vertices:
            p = np.array(v["p"])
            scaled_p = (p - center) * scale_factor
            v["p"] = [float(x) for x in scaled_p]
            scaled_vertices.append(v)
        
        return {
            "vertices": scaled_vertices,
            "faces": faces,
            "edges": [],
            "scale_factor": scale_factor
        }
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
    
    result = stl_to_mesh(stl_path)
    print(json.dumps(result))
