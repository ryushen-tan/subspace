"""
Render Mesh model to image.
"""
import os
os.environ['PYOPENGL_PLATFORM'] = 'osmesa'
os.environ['DISPLAY'] = ''

import trimesh
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance
import io
from typing import Optional
from models.mesh import Mesh

try:
    import pyrender
    PYRENDER_AVAILABLE = True
except ImportError:
    PYRENDER_AVAILABLE = False


def render_mesh_to_png(mesh: Mesh, width: int = 1024, height: int = 1024, camera_angle: str = "perspective") -> bytes:
    """
    Render Mesh model to PNG image.
    
    Args:
        mesh: Mesh model instance
        width: Image width
        height: Image height
        camera_angle: Camera angle ("front", "side", "top", "perspective")
    
    Returns:
        PNG image bytes
    """
    if not mesh.vertices:
        return _create_fallback_image(width, height)
    
    try:
        # Convert Mesh to trimesh
        vertices = np.array([[v.p[0], v.p[1], v.p[2]] for v in mesh.vertices])
        
        # Create faces - convert vertex IDs to indices
        id_to_idx = {v.id: i for i, v in enumerate(mesh.vertices)}
        faces = []
        for face in mesh.faces:
            indices = [id_to_idx.get(vid) for vid in face if vid in id_to_idx]
            if len(indices) >= 3:
                # Triangulate if needed
                if len(indices) == 3:
                    faces.append(indices)
                elif len(indices) == 4:
                    # Quad to two triangles
                    faces.append([indices[0], indices[1], indices[2]])
                    faces.append([indices[0], indices[2], indices[3]])
                else:
                    # Fan triangulation
                    for i in range(1, len(indices) - 1):
                        faces.append([indices[0], indices[i], indices[i + 1]])
        
        if not faces:
            return _create_fallback_image(width, height)
        
        faces_array = np.array(faces)
        trimesh_mesh = trimesh.Trimesh(vertices=vertices, faces=faces_array)
        
        # Render using pyrender if available
        if PYRENDER_AVAILABLE:
            try:
                # Create mesh with proper material (white/light gray so it's visible)
                material = pyrender.MetallicRoughnessMaterial(
                    metallicFactor=0.1,
                    roughnessFactor=0.8,
                    baseColorFactor=[0.8, 0.8, 0.9, 1.0]  # Light blue-gray color
                )
                pyrender_mesh = pyrender.Mesh.from_trimesh(trimesh_mesh, material=material)
                scene = pyrender.Scene(bg_color=[1.0, 1.0, 1.0, 1.0])  # White background
                scene.add(pyrender_mesh)
                
                camera = pyrender.PerspectiveCamera(yfov=np.pi / 3.0, aspectRatio=width/height)
                bounds = trimesh_mesh.bounds
                center = (bounds[0] + bounds[1]) / 2
                size = bounds[1] - bounds[0]
                max_size = max(size) if max(size) > 0 else 1.0
                
                # Position camera based on angle and make it look at center
                camera_pose = np.eye(4)
                if camera_angle == "front":
                    camera_pose[:3, 3] = center + np.array([0, 0, max_size * 2])
                    # Look at center
                    forward = center - camera_pose[:3, 3]
                    forward = forward / np.linalg.norm(forward)
                    right = np.cross(forward, np.array([0, 1, 0]))
                    right = right / np.linalg.norm(right)
                    up = np.cross(right, forward)
                    camera_pose[:3, :3] = np.column_stack([right, up, -forward])
                elif camera_angle == "side" or camera_angle == "right":
                    camera_pose[:3, 3] = center + np.array([max_size * 2, 0, 0])
                    forward = center - camera_pose[:3, 3]
                    forward = forward / np.linalg.norm(forward)
                    right = np.cross(forward, np.array([0, 1, 0]))
                    right = right / np.linalg.norm(right)
                    up = np.cross(right, forward)
                    camera_pose[:3, :3] = np.column_stack([right, up, -forward])
                elif camera_angle == "left":
                    camera_pose[:3, 3] = center + np.array([-max_size * 2, 0, 0])
                    forward = center - camera_pose[:3, 3]
                    forward = forward / np.linalg.norm(forward)
                    right = np.cross(forward, np.array([0, 1, 0]))
                    right = right / np.linalg.norm(right)
                    up = np.cross(right, forward)
                    camera_pose[:3, :3] = np.column_stack([right, up, -forward])
                elif camera_angle == "top":
                    camera_pose[:3, 3] = center + np.array([0, max_size * 2, 0])
                    forward = center - camera_pose[:3, 3]
                    forward = forward / np.linalg.norm(forward)
                    right = np.cross(forward, np.array([1, 0, 0]))
                    right = right / np.linalg.norm(right)
                    up = np.cross(right, forward)
                    camera_pose[:3, :3] = np.column_stack([right, up, -forward])
                elif camera_angle == "bottom":
                    camera_pose[:3, 3] = center + np.array([0, -max_size * 2, 0])
                    forward = center - camera_pose[:3, 3]
                    forward = forward / np.linalg.norm(forward)
                    right = np.cross(forward, np.array([1, 0, 0]))
                    right = right / np.linalg.norm(right)
                    up = np.cross(right, forward)
                    camera_pose[:3, :3] = np.column_stack([right, up, -forward])
                elif camera_angle == "back":
                    camera_pose[:3, 3] = center + np.array([0, 0, -max_size * 2])
                    forward = center - camera_pose[:3, 3]
                    forward = forward / np.linalg.norm(forward)
                    right = np.cross(forward, np.array([0, 1, 0]))
                    right = right / np.linalg.norm(right)
                    up = np.cross(right, forward)
                    camera_pose[:3, :3] = np.column_stack([right, up, -forward])
                else:  # perspective/isometric
                    camera_pose[:3, 3] = center + np.array([max_size * 1.5, max_size * 1.5, max_size * 1.5])
                    forward = center - camera_pose[:3, 3]
                    forward = forward / np.linalg.norm(forward)
                    right = np.cross(forward, np.array([0, 1, 0]))
                    right = right / np.linalg.norm(right)
                    up = np.cross(right, forward)
                    camera_pose[:3, :3] = np.column_stack([right, up, -forward])
                
                scene.add(camera, pose=camera_pose)
                
                # Add multiple lights for better visibility
                # Main directional light
                light1 = pyrender.DirectionalLight(color=np.ones(3), intensity=5.0)
                light1_pose = np.eye(4)
                light1_pose[:3, 3] = center + np.array([max_size, max_size, max_size])
                scene.add(light1, pose=light1_pose)
                
                # Ambient light for overall illumination
                light2 = pyrender.DirectionalLight(color=np.ones(3), intensity=2.0)
                light2_pose = np.eye(4)
                light2_pose[:3, 3] = center + np.array([-max_size, max_size, -max_size])
                scene.add(light2, pose=light2_pose)
                
                # Point light for fill
                light3 = pyrender.PointLight(color=np.ones(3), intensity=3.0)
                light3_pose = np.eye(4)
                light3_pose[:3, 3] = center
                scene.add(light3, pose=light3_pose)
                
                renderer = pyrender.OffscreenRenderer(width, height)
                color, depth = renderer.render(scene)
                renderer.delete()
                
                # Ensure image is in RGB format and has good contrast
                img = Image.fromarray(color)
                # Enhance contrast slightly to make model more visible
                enhancer = ImageEnhance.Contrast(img)
                img = enhancer.enhance(1.2)
                
                img_bytes = io.BytesIO()
                img.save(img_bytes, format='PNG')
                return img_bytes.getvalue()
            except Exception as e:
                print(f"Pyrender failed: {e}, trying trimesh fallback")
        
        # Fallback to trimesh (headless, no viewer needed)
        try:
            # Create scene with white background
            scene = trimesh.Scene([trimesh_mesh])
            # Set background color to white
            scene.camera.resolution = [width, height]
            scene.camera.fov = [60, 60]
            
            # Render with white background
            png_bytes = scene.save_image(resolution=(width, height))
            
            # Open the image and ensure it has white background
            img = Image.open(io.BytesIO(png_bytes))
            if img.mode == 'RGBA':
                # Create white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[3])  # Use alpha channel as mask
                img = background
            
            # Enhance contrast
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.2)
            
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='PNG')
            return img_bytes.getvalue()
        except Exception as e2:
            print(f"Trimesh scene rendering failed: {e2}")
            return _create_fallback_image(width, height)
        
    except Exception as e:
        print(f"Rendering failed: {e}")
        return _create_fallback_image(width, height)


def render_mesh_multiview(mesh: Mesh, width: int = 1024, height: int = 1024) -> list[bytes]:
    """
    Render mesh from multiple angles.
    
    Returns:
        List of PNG image bytes: [front, side, top, perspective, back, bottom, left, right]
    """
    views = []
    # Generate 8 views for better understanding
    for angle in ["front", "side", "top", "perspective", "back", "bottom", "left", "right"]:
        view_bytes = render_mesh_to_png(mesh, width=width, height=height, camera_angle=angle)
        views.append(view_bytes)
    return views


def _create_fallback_image(width: int, height: int) -> bytes:
    """Create placeholder image."""
    img = Image.new('RGB', (width, height), color='gray')
    draw = ImageDraw.Draw(img)
    text = "3D Model Preview"
    bbox = draw.textbbox((0, 0), text)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((width - text_width) // 2, (height - text_height) // 2)
    draw.text(position, text, fill='white')
    
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    return img_bytes.getvalue()
