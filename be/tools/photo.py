from typing import Any
from .base import Tool
from models.agent import AgentState
from services.photo_to_3d import PhotoTo3DService


class PhotoTo3DTool(Tool):
    name = "photo_to_3d"
    description = "Upload and analyze a photo of an object on paper to generate a 3D model"
    parameters = {
        "type": "object",
        "properties": {
            "image_path": {
                "type": "string",
                "description": "Path to the image file containing the object on paper",
            },
            "paper_size": {
                "type": "string",
                "enum": ["letter", "a4"],
                "description": "Paper size in the photo (US Letter or A4)",
            },
        },
        "required": ["image_path", "paper_size"],
    }

    def __init__(self):
        self.service = None
    
    def _get_service(self):
        """Lazy initialize the service"""
        if self.service is None:
            self.service = PhotoTo3DService()
        return self.service

    def execute(self, state: AgentState, **kwargs) -> dict[str, Any]:
        """Execute the photo to 3D conversion"""
        image_path = kwargs.get("image_path")
        paper_size = kwargs.get("paper_size", "letter")

        if not image_path:
            return {"error": "image_path is required"}

        try:
            service = self._get_service()
            # Analyze the photo using Gemini Vision
            analysis = service.analyze_photo(image_path, paper_size)

            # Generate 3D mesh from analysis
            mesh = service.generate_mesh_from_analysis(analysis)

            # Update the agent state with the generated mesh
            state.mesh = mesh

            return {
                "success": True,
                "analysis": analysis,
                "mesh": {
                    "vertices": [
                        {"id": v.id, "p": list(v.p)} for v in mesh.vertices
                    ],
                    "faces": [list(f) for f in mesh.faces],
                    "edges": [list(e) for e in mesh.edges],
                    "scale_factor": mesh.scale_factor,
                },
                "message": f"Successfully created 3D model of {analysis.get('object_name', 'object')}",
            }
        except ValueError as e:
            return {"error": f"Validation error: {str(e)}"}
        except Exception as e:
            return {"error": f"Failed to process image: {str(e)}"}
