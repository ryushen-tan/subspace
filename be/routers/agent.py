from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Query
from pydantic import BaseModel
from typing import Any
import json
import os
import shutil
import subprocess
import logging
from ai.agent import AgentRunner
from services.mesh_service import MeshService
from services.step_analyzer import analyze_step_file
from services.photo_to_3d import PhotoTo3DService
from models.mesh import Mesh
from services.preview_generator import generate_preview_image
from fastapi.responses import Response
from tools import tool_registry

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["agent"])
agent_runner = AgentRunner()


class StartRequest(BaseModel):
    pass


class MessageRequest(BaseModel):
    content: str


class ToolResponseRequest(BaseModel):
    id: str
    result: Any = None
    error: str | None = None


@router.post("/upload-step")
async def upload_step(file: UploadFile = File(...), session_id: str | None = None):
    if not file.filename.endswith('.step') and not file.filename.endswith('.stp'):
        raise HTTPException(status_code=400, detail="Only .step or .stp files are allowed")

    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Get the absolute path to the converter script
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        converter_path = os.path.join(base_dir, "utils", "step_converter.py")
        
        # Run the converter script
        result = subprocess.run(
            ["python3", converter_path, file_path],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Conversion failed: {result.stderr}")
        
        mesh_data = json.loads(result.stdout)
        if "error" in mesh_data:
            raise HTTPException(status_code=500, detail=mesh_data["error"])
        
        # Analyze STEP file using vision model
        analysis = None
        try:
            logger.info("Analyzing STEP file with Gemini vision...")
            analysis = analyze_step_file(file_path)
            if analysis:
                logger.info(f"Analysis completed: {analysis[:100]}...")
        except Exception as e:
            logger.warning(f"STEP file analysis failed: {e}", exc_info=True)
            # Continue without analysis - don't fail the upload
        
        if session_id:
            session = agent_runner.get_session(session_id)
            if session:
                session.state.mesh = Mesh(**{k: v for k, v in mesh_data.items() 
                                              if k in ['vertices', 'faces', 'edges', 'scale_factor']})
                # Inject analysis and summary into agent context
                summary_text = mesh_data.get("summary_text", "")
                if analysis:
                    agent_runner.inject_step_analysis(session_id, f"{analysis}\n\nMesh summary: {summary_text}")
                elif summary_text:
                    agent_runner.inject_step_analysis(session_id, f"Mesh summary: {summary_text}")
        
        # Return mesh data with analysis
        result_data = mesh_data.copy()
        if analysis:
            result_data["analysis"] = analysis
        
        return result_data
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


@router.post("/upload-stl")
async def upload_stl(file: UploadFile = File(...), session_id: str | None = None):
    if not file.filename.lower().endswith('.stl'):
        raise HTTPException(status_code=400, detail="Only .stl files are allowed")

    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Get the absolute path to the converter script
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        converter_path = os.path.join(base_dir, "utils", "stl_converter.py")
        
        # Run the converter script
        result = subprocess.run(
            ["python3", converter_path, file_path],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Conversion failed: {result.stderr}")
        
        mesh_data = json.loads(result.stdout)
        if "error" in mesh_data:
            raise HTTPException(status_code=500, detail=mesh_data["error"])
        
        if session_id:
            session = agent_runner.get_session(session_id)
            if session:
                session.state.mesh = Mesh(**{k: v for k, v in mesh_data.items() 
                                              if k in ['vertices', 'faces', 'edges', 'scale_factor']})
                # Notify agent about the uploaded mesh with summary
                summary_text = mesh_data.get("summary_text", "")
                agent_runner.notify_mesh_uploaded(session_id, file_type="STL", filename=file.filename, summary=summary_text)
        
        return mesh_data
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


@router.post("/upload-photo")
async def upload_photo(
    file: UploadFile = File(...),
    paper_size: str = Query("letter", description="Paper size: 'letter' or 'a4'"),
    session_id: str | None = None
):
    """Upload a photo of an object on paper and generate a 3D model"""
    allowed_formats = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Only image files are allowed: {', '.join(allowed_formats)}"
        )

    if paper_size not in ["letter", "a4"]:
        raise HTTPException(
            status_code=400,
            detail="paper_size must be 'letter' or 'a4'"
        )

    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        service = PhotoTo3DService()
        
        # Analyze the photo
        analysis = await service.analyze_photo(file_path, paper_size)
        
        # Generate mesh from analysis
        mesh = service.generate_mesh_from_analysis(analysis)
        
        # Update session if provided
        if session_id:
            session = agent_runner.get_session(session_id)
            if session:
                session.state.mesh = mesh
                agent_runner.notify_mesh_uploaded(
                    session_id,
                    file_type="PHOTO",
                    filename=file.filename,
                    summary=f"Generated 3D model of {analysis.get('object_name', 'object')}"
                )
        
        # Return mesh data with analysis
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
            "message": f"Successfully created 3D model from photo"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Photo to 3D conversion failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


@router.post("/start")
async def start_session():
    session = agent_runner.create_session()
    return {"session_id": session.id, "state": session.state}


@router.get("/{session_id}/state")
async def get_state(session_id: str):
    session = agent_runner.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "state": session.state,
        "history_length": len(session.history),
    }


@router.get("/{session_id}/mesh")
async def get_mesh(session_id: str):
    session = agent_runner.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.state.mesh


@router.get("/{session_id}/mesh/obj")
async def get_mesh_obj(session_id: str):
    session = agent_runner.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    obj_content = MeshService.export_obj(session.state.mesh)
    return {"obj": obj_content}


@router.post("/{session_id}/message")
async def send_message(session_id: str, request: MessageRequest):
    session = agent_runner.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    agent_runner.add_message(session_id, "user", request.content)
    response = agent_runner.run_step(session_id)

    return {
        "response": response,
        "state": session.state,
    }


@router.post("/{session_id}/step")
async def run_step(session_id: str):
    session = agent_runner.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    response = agent_runner.run_step(session_id)
    return {
        "response": response,
        "state": session.state,
    }


@router.post("/{session_id}/run")
async def run_until_complete(session_id: str):
    session = agent_runner.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    responses = agent_runner.run_until_complete(session_id)
    return {
        "responses": responses,
        "state": session.state,
    }


@router.post("/{session_id}/tool_response")
async def external_tool_response(session_id: str, request: ToolResponseRequest):
    session = agent_runner.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.history.append({
        "role": "tool",
        "tool_call_id": request.id,
        "content": str(request.result or request.error),
    })

    return {"success": True}


@router.websocket("/ws")
async def agent_ws(websocket: WebSocket):
    await websocket.accept()
    session_id: str | None = None

    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})
                continue

            message_type = payload.get("type")

            if message_type == "start":
                prompt = payload.get("prompt", "")
                session = agent_runner.create_session(prompt)
                session_id = session.id
                await websocket.send_json({"type": "session", "session_id": session_id})
                continue

            if not session_id:
                await websocket.send_json({"type": "error", "message": "Session not initialized"})
                continue

            session = agent_runner.get_session(session_id)
            if not session:
                await websocket.send_json({"type": "error", "message": "Session not found"})
                continue

            if message_type == "step":
                response = agent_runner.run_step(session_id)
                await websocket.send_json({
                    "type": "response",
                    "response": response.model_dump() if response else None,
                    "state": session.state.model_dump(),
                })
                continue

            if message_type == "message":
                content = payload.get("content", "")
                
                if content.strip().startswith("/"):
                    cmd = content.strip().split()[0].lower()
                    tool_map = {
                        "/generate-supports": "generate_supports",
                        "/inspect-mesh": "inspect_mesh",
                        "/verify": "verify_mesh",
                        "/render": "render_preview",
                        "/finalize": "finalize",
                    }
                    tool_name = tool_map.get(cmd)
                    if tool_name and tool_name in tool_registry:
                        tool = tool_registry[tool_name]
                        try:
                            result = tool.execute(session.state)
                            await websocket.send_json({
                                "type": "response",
                                "response": {"id": f"cmd_{tool_name}", "result": result},
                                "state": session.state.model_dump(),
                            })
                        except Exception as e:
                            await websocket.send_json({
                                "type": "response",
                                "response": {"id": f"cmd_{tool_name}", "error": str(e)},
                                "state": session.state.model_dump(),
                            })
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Unknown command: {cmd}",
                        })
                    continue
                
                agent_runner.add_message(session_id, "user", content)
                session.state.task_complete = False
                session.state.finalized = False
                session.state.iteration = 0
                try:
                    while not session.state.task_complete and not session.state.finalized:
                        response = agent_runner.run_step(session_id)
                        
                        await websocket.send_json({
                            "type": "response",
                            "response": response.model_dump() if response else None,
                            "state": session.state.model_dump(),
                        })
                        
                        # Check immediately after run_step if task is complete and break
                        if session.state.task_complete or session.state.finalized:
                            break
                            
                        if response and response.error:
                            break
                        # Auto-stop if all tasks are done and mesh was submitted
                        if session.state.todo and all(t.get("done", False) for t in session.state.todo):
                            if session.state.mesh.vertices:
                                # If mesh exists and all tasks done, stop to prevent infinite loop
                                session.state.task_complete = True
                                break
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e),
                    })
                continue

    except WebSocketDisconnect:
        return


class PreviewRequest(BaseModel):
    background_path: str
    mesh: dict
    session_id: str | None = None


@router.post("/generate-preview")
async def generate_preview(request: PreviewRequest):
    """
    Generate a preview image by combining a 3D model with a background.
    """
    try:
        # Convert mesh dict to Mesh model
        mesh = Mesh(**request.mesh)
        
        # Generate preview
        preview_bytes = generate_preview_image(
            background_path=request.background_path,
            mesh_data=request.mesh,
            session_id=request.session_id
        )
        
        return Response(content=preview_bytes, media_type="image/png")
        
    except Exception as e:
        logger.error(f"Error generating preview: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate preview: {str(e)}")
