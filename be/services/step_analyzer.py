"""
Service to analyze STEP files using vision model.
Pipeline: STEP → STL → PNG → Gemini Vision → Description
"""
import os
import tempfile
import logging
from utils.stl_converter import step_to_stl
from utils.image_renderer import render_stl_to_base64
from ai.openrouter import OpenRouterClient

logger = logging.getLogger(__name__)


def analyze_step_file(step_path: str) -> str | None:
    """
    Analyze a STEP file by converting to STL, rendering to PNG, and asking Gemini.
    
    Args:
        step_path: Path to STEP file
    
    Returns:
        Description string or None if analysis fails
    """
    temp_stl = None
    try:
        # Create temporary STL file
        temp_dir = tempfile.gettempdir()
        temp_stl = os.path.join(temp_dir, f"temp_{os.path.basename(step_path)}.stl")
        
        # Convert STEP to STL
        logger.info(f"Converting STEP to STL: {step_path} -> {temp_stl}")
        conversion_result = step_to_stl(step_path, temp_stl)
        
        if not conversion_result.get("success"):
            error = conversion_result.get("error", "Unknown error")
            logger.error(f"STEP to STL conversion failed: {error}")
            return None
        
        if not os.path.exists(temp_stl):
            logger.error(f"STL file was not created: {temp_stl}")
            return None
        
        # Render STL to PNG (base64)
        logger.info(f"Rendering STL to image: {temp_stl}")
        image_base64 = render_stl_to_base64(temp_stl, width=1024, height=1024)
        
        # Send to Gemini via OpenRouter
        logger.info("Sending image to Gemini for analysis")
        client = OpenRouterClient()
        prompt = "What does this 3D object look like? Describe its shape, features, and what type of object it appears to be."
        
        analysis = client.chat_with_image(image_base64, prompt)
        
        logger.info(f"Analysis completed: {analysis[:100]}...")
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing STEP file: {e}", exc_info=True)
        return None
    finally:
        # Clean up temporary STL file
        if temp_stl and os.path.exists(temp_stl):
            try:
                os.remove(temp_stl)
            except Exception as e:
                logger.warning(f"Failed to remove temp STL file: {e}")
