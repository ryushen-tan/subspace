import os
# Force headless mode before importing any rendering libraries
os.environ['PYOPENGL_PLATFORM'] = 'osmesa'  # Use OSMesa for headless rendering
os.environ['DISPLAY'] = ''  # Prevent X11 display from opening

import trimesh
import numpy as np
from PIL import Image, ImageDraw
import io
import base64
from typing import Optional

# Import pyrender after setting environment variables
try:
    import pyrender
    PYRENDER_AVAILABLE = True
except ImportError:
    PYRENDER_AVAILABLE = False


def render_stl_to_png(stl_path: str, output_path: Optional[str] = None, width: int = 1024, height: int = 1024) -> bytes:
    """
    Render STL file to PNG image using pyrender (headless).
    
    Args:
        stl_path: Path to STL file
        output_path: Optional path to save PNG (if None, returns bytes)
        width: Image width in pixels
        height: Image height in pixels
    
    Returns:
        PNG image as bytes
    """
    # Load STL mesh first (needed for all rendering methods)
    try:
        mesh = trimesh.load(stl_path)
    except Exception as e:
        print(f"Warning: Failed to load STL: {e}, using fallback")
        return _create_fallback_image(width, height)
    
    # Try pyrender first (best quality) - only if available
    if PYRENDER_AVAILABLE:
        try:
            # Convert trimesh to pyrender mesh
            pyrender_mesh = pyrender.Mesh.from_trimesh(mesh)
            
            # Create scene
            scene = pyrender.Scene()
            scene.add(pyrender_mesh)
            
            # Set up camera
            camera = pyrender.PerspectiveCamera(yfov=np.pi / 3.0, aspectRatio=width/height)
            
            # Position camera to view the object
            # Get mesh bounds
            bounds = mesh.bounds
            center = (bounds[0] + bounds[1]) / 2
            size = bounds[1] - bounds[0]
            max_size = max(size) if max(size) > 0 else 1.0
            
            # Position camera at a good distance
            camera_pose = np.eye(4)
            camera_pose[:3, 3] = center + np.array([max_size * 1.5, max_size * 1.5, max_size * 1.5])
            scene.add(camera, pose=camera_pose)
            
            # Add light
            light = pyrender.DirectionalLight(color=np.ones(3), intensity=3.0)
            light_pose = np.eye(4)
            light_pose[:3, 3] = center + np.array([max_size, max_size, max_size])
            scene.add(light, pose=light_pose)
            
            # Render using offscreen renderer (headless)
            try:
                renderer = pyrender.OffscreenRenderer(width, height)
                color, depth = renderer.render(scene)
                renderer.delete()
                
                # Convert to PIL Image and then to PNG bytes
                img = Image.fromarray(color)
                img_bytes = io.BytesIO()
                img.save(img_bytes, format='PNG')
                png_bytes = img_bytes.getvalue()
                
                if output_path:
                    with open(output_path, 'wb') as f:
                        f.write(png_bytes)
                
                return png_bytes
            except Exception as render_error:
                # If offscreen renderer fails, fall through to trimesh
                print(f"Warning: pyrender offscreen failed: {render_error}, trying trimesh fallback")
                raise
        except Exception as e:
            # Fallback: try trimesh scene rendering
            pass
    
    # Fallback: try trimesh scene rendering (also headless)
    try:
        # Trimesh save_image should be headless by default, but ensure no viewer
        scene = trimesh.Scene([mesh])
        # Use export_image which is more reliable for headless rendering
        png_bytes = scene.save_image(resolution=(width, height))
        if output_path:
            with open(output_path, 'wb') as f:
                f.write(png_bytes)
        return png_bytes
    except Exception as e2:
        # Final fallback: create placeholder
        print(f"Warning: All rendering methods failed, using fallback image")
        return _create_fallback_image(width, height)


def render_stl_to_base64(stl_path: str, width: int = 1024, height: int = 1024) -> str:
    """
    Render STL file to base64-encoded PNG string.
    
    Args:
        stl_path: Path to STL file
        width: Image width in pixels
        height: Image height in pixels
    
    Returns:
        Base64-encoded PNG image string
    """
    png_bytes = render_stl_to_png(stl_path, width=width, height=height)
    return base64.b64encode(png_bytes).decode('utf-8')


def _create_fallback_image(width: int, height: int) -> bytes:
    """Create a simple placeholder image if rendering fails."""
    img = Image.new('RGB', (width, height), color='gray')
    draw = ImageDraw.Draw(img)
    text = "3D Model Preview"
    # Get text size and center it
    bbox = draw.textbbox((0, 0), text)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((width - text_width) // 2, (height - text_height) // 2)
    draw.text(position, text, fill='white')
    
    # Save to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    return img_bytes.getvalue()
