import cadquery as cq
import json
import sys
import os

def step_to_mesh(step_path):
    try:
        # Load the STEP file
        part = cq.importers.importStep(step_path)
        
        # Tessellate the part
        # part is a Workplane, we need the underlying shape
        shape = part.val()
        
        # Calculate bounding box for scaling
        bb = shape.BoundingBox()
        max_dim = max(bb.xlen, bb.ylen, bb.zlen)
        
        # Target size is 10 units for the largest dimension
        target_size = 10.0
        scale_factor = 1.0
        if max_dim > 0:
            scale_factor = target_size / max_dim
            
        # Center the object
        center_x = bb.xmin + bb.xlen / 2
        center_y = bb.ymin + bb.ylen / 2
        center_z = bb.zmin + bb.zlen / 2
        
        # Tessellate the part
        # tolerance and angularTolerance control the mesh quality
        mesh = shape.tessellate(tolerance=0.1, angularTolerance=0.1)
        
        raw_vertices = mesh[0]
        raw_triangles = mesh[1]
        
        vertices = []
        faces = []
        
        # Deduplication logic
        unique_points = {} # (x, y, z) -> new_index
        index_map = {}    # old_index -> new_index
        
        for i, v in enumerate(raw_vertices):
            # Apply centering and scaling
            scaled_p = (
                (v.x - center_x) * scale_factor,
                (v.y - center_y) * scale_factor,
                (v.z - center_z) * scale_factor
            )
            
            # Use rounded coordinates as key for deduplication
            # 6 decimal places should be enough for CAD data
            key = (round(scaled_p[0], 6), round(scaled_p[1], 6), round(scaled_p[2], 6))
            
            if key not in unique_points:
                new_idx = len(vertices)
                unique_points[key] = new_idx
                vertices.append({
                    "id": str(new_idx),
                    "p": [scaled_p[0], scaled_p[1], scaled_p[2]]
                })
            
            index_map[i] = unique_points[key]
            
        for f in raw_triangles:
            # Map old indices to new deduplicated indices
            new_face = [str(index_map[idx]) for idx in f]
            faces.append(new_face)
            
        return {
            "vertices": vertices,
            "faces": faces,
            "edges": [], # We can extract edges if needed, but faces are enough for display
            "scale_factor": scale_factor
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)
        
    step_path = sys.argv[1]
    if not os.path.exists(step_path):
        print(json.dumps({"error": f"File not found: {step_path}"}))
        sys.exit(1)
        
    result = step_to_mesh(step_path)
    print(json.dumps(result))
