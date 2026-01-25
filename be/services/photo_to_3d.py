import json
import base64
import httpx
from pathlib import Path
from typing import Optional
from config.settings import get_settings
from models.mesh import Vertex, Mesh


class PhotoTo3DService:
    """Service to convert photos of objects to 3D models using OpenRouter's Gemini Vision"""
    
    # Standard paper sizes in millimeters
    PAPER_SIZES = {
        "letter": {"width": 215.9, "height": 279.4, "name": "US Letter"},  # 8.5" x 11"
        "a4": {"width": 210, "height": 297, "name": "A4"},
    }

    def __init__(self):
        self.settings = get_settings()

    @staticmethod
    def _encode_image_to_base64(image_path: str) -> str:
        """Encode image file to base64 string"""
        with open(image_path, "rb") as image_file:
            return base64.standard_b64encode(image_file.read()).decode("utf-8")

    async def analyze_photo(self, image_path: str, paper_size: str = "letter") -> dict:
        """
        Analyze a photo of an object on paper using OpenRouter's Gemini Vision.
        
        Args:
            image_path: Path to the image file
            paper_size: Either "letter" or "a4"
            
        Returns:
            Dictionary with object analysis including dimensions and characteristics
        """
        if paper_size not in self.PAPER_SIZES:
            raise ValueError(f"Invalid paper size. Must be one of: {list(self.PAPER_SIZES.keys())}")

        paper_info = self.PAPER_SIZES[paper_size]
        
        # Encode image
        image_data = self._encode_image_to_base64(image_path)
        
        # Create prompt for vision analysis
        analysis_prompt = f"""You are analyzing a photo of a physical object placed on {paper_info['name']} paper ({paper_info['width']}mm x {paper_info['height']}mm).

Please analyze this image and provide:
1. Object identification (what is the object?)
2. Approximate dimensions relative to the paper (estimate width, depth, height as percentages of paper size)
3. Shape description (cube, cylinder, sphere, irregular, etc.)
4. Main features and details visible
5. Surface characteristics (flat, curved, rough, smooth)
6. Suggested 3D representation (what basic geometric shapes would represent this object?)

Respond ONLY with valid JSON in this exact format:
{{
    "object_name": "string",
    "description": "string",
    "estimated_dimensions": {{
        "width_percent": number (0-100),
        "depth_percent": number (0-100),
        "height_percent": number (0-100)
    }},
    "shape_type": "cube|cylinder|sphere|rectangular_prism|cone|complex",
    "key_features": ["string"],
    "surface_characteristics": "string",
    "suggested_primitives": [
        {{
            "type": "string",
            "dimensions": {{"x": number, "y": number, "z": number}},
            "position": {{"x": number, "y": number, "z": number}},
            "description": "string"
        }}
    ],
    "construction_notes": "string"
}}"""

        try:
            # Use OpenRouter to call Gemini via their API
            headers = {
                "Authorization": f"Bearer {self.settings.openrouter_api_key}",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Photo to 3D",
                "Content-Type": "application/json",
            }
            
            payload = {
                "model": self.settings.openrouter_model,  # "google/gemini-3-flash-preview"
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": analysis_prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_data}"
                                }
                            }
                        ],
                    }
                ],
            }
            
            # Make async HTTP request using httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=60.0
                )
            
            if response.status_code != 200:
                error_detail = response.text
                raise Exception(f"OpenRouter API error ({response.status_code}): {error_detail}")
            
            response_data = response.json()
            
            # Extract the text response
            if "choices" not in response_data or not response_data["choices"]:
                raise Exception("No choices in OpenRouter response")
            
            response_text = response_data["choices"][0]["message"]["content"]
            
            # Try to parse JSON
            analysis = json.loads(response_text)
            
            # Store paper size info
            analysis["paper_size"] = paper_size
            analysis["paper_dimensions"] = paper_info
            
            return analysis
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse API response as JSON: {str(e)}")
        except Exception as e:
            raise Exception(f"Photo analysis error: {str(e)}")


    def generate_mesh_from_analysis(self, analysis: dict) -> Mesh:
        """
        Generate a 3D mesh from the photo analysis.
        
        Args:
            analysis: Dictionary returned from analyze_photo()
            
        Returns:
            Mesh object representing the analyzed object
        """
        paper_info = analysis.get("paper_dimensions", self.PAPER_SIZES["letter"])
        
        # Convert percentages to actual dimensions in mm
        width_mm = (analysis["estimated_dimensions"]["width_percent"] / 100) * paper_info["width"]
        depth_mm = (analysis["estimated_dimensions"]["depth_percent"] / 100) * paper_info["height"]
        height_mm = (analysis["estimated_dimensions"]["height_percent"] / 100) * paper_info["width"]
        
        # Scale down for 3D workspace (assuming 1 unit = 10mm)
        scale = 0.1
        width = width_mm * scale
        depth = depth_mm * scale
        height = height_mm * scale
        
        # Ensure minimum dimensions
        min_size = 0.1
        width = max(width, min_size)
        depth = max(depth, min_size)
        height = max(height, min_size)
        
        shape_type = analysis.get("shape_type", "cube")
        
        if shape_type == "cube" or shape_type == "rectangular_prism":
            return self._create_rectangular_prism(width, depth, height)
        elif shape_type == "cylinder":
            return self._create_cylinder(width, height, depth)
        elif shape_type == "sphere":
            return self._create_sphere(width)
        elif shape_type == "cone":
            return self._create_cone(width, height)
        else:
            # For complex shapes, create a composite using suggested_primitives
            return self._create_composite_mesh(analysis, scale)

    @staticmethod
    def _create_rectangular_prism(width: float, depth: float, height: float) -> Mesh:
        """Create a rectangular prism mesh"""
        w, d, h = width / 2, depth / 2, height / 2
        
        vertices = [
            Vertex(id="1", p=(-w, -d, -h), source="photo"),
            Vertex(id="2", p=(w, -d, -h), source="photo"),
            Vertex(id="3", p=(w, d, -h), source="photo"),
            Vertex(id="4", p=(-w, d, -h), source="photo"),
            Vertex(id="5", p=(-w, -d, h), source="photo"),
            Vertex(id="6", p=(w, -d, h), source="photo"),
            Vertex(id="7", p=(w, d, h), source="photo"),
            Vertex(id="8", p=(-w, d, h), source="photo"),
        ]
        
        faces = [
            ("1", "2", "3", "4"),  # bottom
            ("5", "8", "7", "6"),  # top
            ("1", "5", "6", "2"),  # front
            ("4", "3", "7", "8"),  # back
            ("1", "4", "8", "5"),  # left
            ("2", "6", "7", "3"),  # right
        ]
        
        edges = [
            ("1", "2"), ("2", "3"), ("3", "4"), ("4", "1"),
            ("5", "6"), ("6", "7"), ("7", "8"), ("8", "5"),
            ("1", "5"), ("2", "6"), ("3", "7"), ("4", "8"),
        ]
        
        return Mesh(vertices=vertices, faces=faces, edges=edges, scale_factor=1.0)

    @staticmethod
    def _create_cylinder(radius: float, height: float, depth: float) -> Mesh:
        """Create a cylinder mesh"""
        r = min(radius, depth) / 2
        h = height / 2
        segments = 8
        
        vertices = []
        # Bottom circle
        for i in range(segments):
            angle = (2 * 3.14159 * i) / segments
            x = r * (angle ** 0.5) * 0.5
            y = r * (1 - (angle ** 0.5) * 0.5)
            vertices.append(Vertex(id=f"b{i}", p=(x, y, -h), source="photo"))
        
        # Top circle
        for i in range(segments):
            angle = (2 * 3.14159 * i) / segments
            x = r * (angle ** 0.5) * 0.5
            y = r * (1 - (angle ** 0.5) * 0.5)
            vertices.append(Vertex(id=f"t{i}", p=(x, y, h), source="photo"))
        
        # Center points for degenerate faces
        vertices.append(Vertex(id="bc", p=(0, 0, -h), source="photo"))
        vertices.append(Vertex(id="tc", p=(0, 0, h), source="photo"))
        
        faces = []
        edges = []
        
        # Side faces
        for i in range(segments):
            next_i = (i + 1) % segments
            faces.append((f"b{i}", f"b{next_i}", f"t{next_i}", f"t{i}"))
            edges.append((f"b{i}", f"b{next_i}"))
            edges.append((f"b{i}", f"t{i}"))
        
        # Top and bottom
        faces.append(tuple([f"b{i}" for i in range(segments)]))
        faces.append(tuple([f"t{i}" for i in range(segments - 1, -1, -1)]))
        
        return Mesh(vertices=vertices, faces=faces, edges=edges, scale_factor=1.0)

    @staticmethod
    def _create_sphere(radius: float) -> Mesh:
        """Create a sphere mesh (low-poly)"""
        vertices = []
        r = radius / 2
        
        # Create icosahedron
        t = (1 + 5 ** 0.5) / 2
        
        points = [
            (-1, t, 0), (1, t, 0), (-1, -t, 0), (1, -t, 0),
            (0, -1, t), (0, 1, t), (0, -1, -t), (0, 1, -t),
            (t, 0, -1), (t, 0, 1), (-t, 0, -1), (-t, 0, 1),
        ]
        
        for i, (x, y, z) in enumerate(points):
            length = (x*x + y*y + z*z) ** 0.5
            vertices.append(Vertex(id=str(i), p=(x/length*r, y/length*r, z/length*r), source="photo"))
        
        # Icosahedron faces
        faces = [
            ("0", "11", "5"), ("0", "5", "1"), ("0", "1", "7"), ("0", "7", "10"), ("0", "10", "11"),
            ("1", "5", "9"), ("5", "11", "4"), ("11", "10", "2"), ("10", "7", "6"), ("7", "1", "8"),
            ("3", "9", "4"), ("3", "4", "2"), ("3", "2", "6"), ("3", "6", "8"), ("3", "8", "9"),
            ("4", "9", "5"), ("2", "4", "11"), ("6", "2", "10"), ("8", "6", "7"), ("9", "8", "1"),
        ]
        
        edges = [
            ("0", "1"), ("0", "5"), ("0", "7"), ("0", "10"), ("0", "11"),
            ("1", "5"), ("1", "7"), ("1", "8"), ("1", "9"),
            ("2", "3"), ("2", "4"), ("2", "6"), ("2", "10"), ("2", "11"),
            ("3", "4"), ("3", "6"), ("3", "8"), ("3", "9"),
            ("4", "5"), ("4", "9"), ("4", "11"),
            ("5", "9"), ("5", "11"),
            ("6", "7"), ("6", "8"), ("6", "10"),
            ("7", "8"), ("7", "10"),
            ("8", "9"),
            ("10", "11"),
        ]
        
        return Mesh(vertices=vertices, faces=faces, edges=edges, scale_factor=1.0)

    @staticmethod
    def _create_cone(radius: float, height: float) -> Mesh:
        """Create a cone mesh"""
        r = radius / 2
        h = height / 2
        segments = 8
        
        vertices = []
        
        # Base circle
        for i in range(segments):
            angle = (2 * 3.14159 * i) / segments
            x = r * (angle ** 0.5) * 0.5
            y = r * (1 - (angle ** 0.5) * 0.5)
            vertices.append(Vertex(id=f"b{i}", p=(x, y, -h), source="photo"))
        
        # Apex
        vertices.append(Vertex(id="apex", p=(0, 0, h), source="photo"))
        
        faces = []
        edges = []
        
        # Side faces
        for i in range(segments):
            next_i = (i + 1) % segments
            faces.append((f"b{i}", f"b{next_i}", "apex"))
            edges.append((f"b{i}", f"b{next_i}"))
            edges.append((f"b{i}", "apex"))
        
        # Base
        faces.append(tuple([f"b{i}" for i in range(segments)]))
        
        return Mesh(vertices=vertices, faces=faces, edges=edges, scale_factor=1.0)

    def _create_composite_mesh(self, analysis: dict, scale: float) -> Mesh:
        """Create a composite mesh from multiple primitives in the analysis"""
        primitives = analysis.get("suggested_primitives", [])
        
        if not primitives:
            # Fallback to rectangular prism
            width = analysis["estimated_dimensions"]["width_percent"] / 100 * 2
            depth = analysis["estimated_dimensions"]["depth_percent"] / 100 * 2
            height = analysis["estimated_dimensions"]["height_percent"] / 100 * 2
            return self._create_rectangular_prism(width, depth, height)
        
        all_vertices = []
        all_faces = []
        all_edges = []
        vertex_offset = 0
        
        for i, prim in enumerate(primitives):
            prim_type = prim.get("type", "cube")
            dims = prim.get("dimensions", {"x": 1, "y": 1, "z": 1})
            pos = prim.get("position", {"x": 0, "y": 0, "z": 0})
            
            width = dims.get("x", 1) * scale
            depth = dims.get("y", 1) * scale
            height = dims.get("z", 1) * scale
            
            offset_x = pos.get("x", 0) * scale
            offset_y = pos.get("y", 0) * scale
            offset_z = pos.get("z", 0) * scale
            
            # Create primitive mesh
            if prim_type == "cube" or prim_type == "rectangular_prism":
                prim_mesh = self._create_rectangular_prism(width, depth, height)
            elif prim_type == "cylinder":
                prim_mesh = self._create_cylinder(width, height, depth)
            elif prim_type == "sphere":
                prim_mesh = self._create_sphere(width)
            elif prim_type == "cone":
                prim_mesh = self._create_cone(width, height)
            else:
                prim_mesh = self._create_rectangular_prism(width, depth, height)
            
            # Translate vertices and add to composite
            for v in prim_mesh.vertices:
                new_v = Vertex(
                    id=f"v{vertex_offset}_{v.id}",
                    p=(v.p[0] + offset_x, v.p[1] + offset_y, v.p[2] + offset_z),
                    source="photo"
                )
                all_vertices.append(new_v)
            
            # Add edges with offset IDs
            for e in prim_mesh.edges:
                new_e = (f"v{vertex_offset}_{e[0]}", f"v{vertex_offset}_{e[1]}")
                all_edges.append(new_e)
            
            # Add faces with offset IDs
            for f in prim_mesh.faces:
                new_f = tuple(f"v{vertex_offset}_{vid}" for vid in f)
                all_faces.append(new_f)
            
            vertex_offset += len(prim_mesh.vertices)
        
        return Mesh(vertices=all_vertices, faces=all_faces, edges=all_edges, scale_factor=1.0)
