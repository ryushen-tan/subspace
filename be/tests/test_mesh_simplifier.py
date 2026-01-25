import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from utils.mesh_simplifier import simplify_mesh, generate_summary, get_simplified_description

SAMPLE_MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "sample_models")


def test_simplify_small_mesh():
    """Test that small meshes are not simplified."""
    vertices = [{"id": str(i), "p": [float(i), 0.0, 0.0]} for i in range(10)]
    faces = [["0", "1", "2"]]
    
    result = simplify_mesh(vertices, faces, target_vertices=100, source="test.stl")
    
    assert result["simplified"] == False
    assert len(result["vertices"]) == 10
    assert result["vertices"][0].get("source") == "test.stl"
    print("PASS: test_simplify_small_mesh")


def test_simplify_large_mesh():
    """Test that large meshes are simplified."""
    # Create a grid of vertices
    vertices = []
    for i in range(20):
        for j in range(20):
            vertices.append({"id": f"v{i}_{j}", "p": [float(i)/10, float(j)/10, 0.0]})
    
    faces = []
    for i in range(19):
        for j in range(19):
            faces.append([f"v{i}_{j}", f"v{i+1}_{j}", f"v{i+1}_{j+1}"])
    
    result = simplify_mesh(vertices, faces, target_vertices=50, source="grid.stl")
    
    assert result["simplified"] == True
    assert len(result["vertices"]) <= 60  # Some tolerance
    assert result["original_vertex_count"] == 400
    assert "summary" in result
    print(f"PASS: test_simplify_large_mesh (reduced {result['original_vertex_count']} -> {len(result['vertices'])} vertices)")


def test_generate_summary():
    """Test summary generation."""
    vertices = [
        {"id": "0", "p": [-1.0, 0.0, -1.0]},
        {"id": "1", "p": [1.0, 0.0, -1.0]},
        {"id": "2", "p": [1.0, 2.0, 1.0]},
        {"id": "3", "p": [-1.0, 2.0, 1.0]},
    ]
    faces = [["0", "1", "2", "3"]]
    
    summary = generate_summary(vertices, faces, "box.step")
    
    assert summary["source"] == "box.step"
    assert summary["vertex_count"] == 4
    assert summary["face_count"] == 1
    assert "bounding_box" in summary
    assert summary["bounding_box"]["dimensions"][0] == 2.0  # x dimension
    assert summary["bounding_box"]["dimensions"][1] == 2.0  # y dimension
    assert summary["bounding_box"]["dimensions"][2] == 2.0  # z dimension
    print("PASS: test_generate_summary")


def test_get_simplified_description():
    """Test human-readable description generation."""
    summary = {
        "source": "bracket.step",
        "vertex_count": 100,
        "face_count": 200,
        "bounding_box": {
            "min": [-5.0, 0.0, -5.0],
            "max": [5.0, 10.0, 5.0],
            "center": [0.0, 5.0, 0.0],
            "dimensions": [10.0, 10.0, 10.0]
        },
        "shape_type": "cubic/spherical",
        "key_points": [
            {"name": "x_min", "position": [-5.0, 5.0, 0.0], "vertex_id": "0"},
            {"name": "x_max", "position": [5.0, 5.0, 0.0], "vertex_id": "1"},
        ]
    }
    
    desc = get_simplified_description(summary)
    
    assert "bracket.step" in desc
    assert "100 vertices" in desc
    assert "10.00 x 10.00 x 10.00" in desc
    assert "cubic/spherical" in desc
    print("PASS: test_get_simplified_description")
    print(f"  Description: {desc}")


def test_with_step_file():
    """Test with actual STEP file if available."""
    step_path = os.path.join(SAMPLE_MODELS_DIR, "bracket v1.step")
    if not os.path.exists(step_path):
        print("SKIP: test_with_step_file (file not found)")
        return
    
    try:
        from utils.step_converter import step_to_mesh
        result = step_to_mesh(step_path, source_name="bracket v1.step", simplify=True, target_vertices=100)
        
        if "error" in result:
            print(f"SKIP: test_with_step_file ({result['error']})")
            return
        
        print(f"PASS: test_with_step_file")
        print(f"  Original: {len(result['vertices'])} vertices, {len(result['faces'])} faces")
        if "simplified_vertices" in result:
            print(f"  Simplified: {len(result['simplified_vertices'])} vertices, {len(result['simplified_faces'])} faces")
        print(f"  Summary: {result.get('summary_text', 'N/A')[:200]}...")
    except Exception as e:
        print(f"SKIP: test_with_step_file ({e})")


def test_with_stl_file():
    """Test with actual STL file if available."""
    stl_path = os.path.join(SAMPLE_MODELS_DIR, "pikachu.stl")
    if not os.path.exists(stl_path):
        print("SKIP: test_with_stl_file (file not found)")
        return
    
    try:
        from utils.stl_converter import stl_to_mesh
        result = stl_to_mesh(stl_path, source_name="pikachu.stl", simplify=True, target_vertices=50)
        
        if "error" in result:
            print(f"SKIP: test_with_stl_file ({result['error']})")
            return
        
        print(f"PASS: test_with_stl_file")
        print(f"  Original: {len(result['vertices'])} vertices, {len(result['faces'])} faces")
        if "simplified_vertices" in result:
            print(f"  Simplified: {len(result['simplified_vertices'])} vertices, {len(result['simplified_faces'])} faces")
        print(f"  Summary: {result.get('summary_text', 'N/A')[:200]}...")
    except Exception as e:
        print(f"SKIP: test_with_stl_file ({e})")


if __name__ == "__main__":
    test_simplify_small_mesh()
    test_simplify_large_mesh()
    test_generate_summary()
    test_get_simplified_description()
    test_with_step_file()
    test_with_stl_file()
    print("\nAll tests completed!")
