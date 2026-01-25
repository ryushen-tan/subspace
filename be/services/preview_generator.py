"""
Service to generate preview images by combining 3D models with backgrounds.
"""
import os
import logging
from typing import Optional
from PIL import Image
import io
from models.mesh import Mesh
from utils.mesh_renderer import render_mesh_to_png

logger = logging.getLogger(__name__)


def generate_preview_image(
    background_path: str,
    mesh_data: dict,
    session_id: Optional[str] = None,
    output_path: Optional[str] = None
) -> bytes:
    """
    Generate a preview image by combining a 3D model with a background.
    
    Args:
        background_path: Path to background image (relative to public folder or absolute)
        mesh_data: Mesh data dictionary with vertices, faces, etc.
        session_id: Optional session ID for conversation context
        output_path: Optional path to save the result
    
    Returns:
        PNG image bytes
    """
    try:
        # Load background image
        # Normalize the path (remove leading slash if present)
        normalized_path = background_path.lstrip('/')
        
        # Get the project root directory
        # __file__ is be/services/preview_generator.py
        # So: be_dir = be/, project_root = parent of be/
        current_file = os.path.abspath(__file__)
        be_dir = os.path.dirname(os.path.dirname(current_file))  # be/
        project_root = os.path.dirname(be_dir)  # project root
        
        # Try multiple possible locations
        possible_paths = [
            # From project root: fe/public/filename (most likely)
            os.path.join(project_root, 'fe', 'public', normalized_path),
            # Relative to be directory (alternative)
            os.path.abspath(os.path.join(be_dir, '..', 'fe', 'public', normalized_path)),
        ]
        
        # If it's an absolute path, try it directly
        if os.path.isabs(background_path):
            possible_paths.insert(0, background_path)
        
        # Try each path
        public_path = None
        for path in possible_paths:
            abs_path = os.path.abspath(path) if not os.path.isabs(path) else path
            logger.info(f"Trying background path: {abs_path}")
            if os.path.exists(abs_path):
                public_path = abs_path
                logger.info(f"Found background image at: {public_path}")
                break
        
        if not public_path or not os.path.exists(public_path):
            # Log all attempted paths for debugging
            logger.error(f"Background image not found. Tried paths: {possible_paths}")
            logger.error(f"Project root: {project_root}, BE dir: {be_dir}, Normalized path: {normalized_path}")
            raise FileNotFoundError(f"Background image not found: {background_path}. Tried: {possible_paths}")
        
        logger.info(f"Loading background from: {public_path}")
        background_img = Image.open(public_path)
        
        # Render the mesh from perspective view
        mesh = Mesh(**mesh_data)
        logger.info("Rendering mesh for preview...")
        mesh_render_bytes = render_mesh_to_png(mesh, width=1024, height=1024, camera_angle="perspective")
        mesh_img = Image.open(io.BytesIO(mesh_render_bytes))
        
        # Simple compositing: place mesh on background
        preview_width = 1920
        preview_height = 1080
        background_resized = background_img.resize((preview_width, preview_height), Image.Resampling.LANCZOS)
        
        # Resize mesh image to fit nicely on background
        mesh_width = int(preview_width * 0.5)
        mesh_height = int(mesh_img.height * (mesh_width / mesh_img.width))
        mesh_resized = mesh_img.resize((mesh_width, mesh_height), Image.Resampling.LANCZOS)
        
        # Create result image
        result_img = background_resized.copy()
        x_offset = (preview_width - mesh_width) // 2
        y_offset = int(preview_height * 0.65) - (mesh_height // 2)
        
        # Convert to RGBA for alpha blending
        if result_img.mode != 'RGBA':
            result_img = result_img.convert('RGBA')
        if mesh_resized.mode != 'RGBA':
            mesh_resized = mesh_resized.convert('RGBA')
        
        # Composite mesh onto background
        result_img.paste(mesh_resized, (x_offset, y_offset), mesh_resized)
        result_img = result_img.convert('RGB')
        
        output_buffer = io.BytesIO()
        result_img.save(output_buffer, format='PNG')
        result_bytes = output_buffer.getvalue()
        
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(result_bytes)
        
        logger.info("Preview image generated successfully")
        return result_bytes
        
    except Exception as e:
        logger.error(f"Error generating preview: {e}", exc_info=True)
        raise
