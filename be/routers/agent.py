from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
from ai.agent import AgentRunner
from services.mesh_service import MeshService

router = APIRouter(prefix="/agent", tags=["agent"])
agent_runner = AgentRunner()


class StartRequest(BaseModel):
    prompt: str = ""


class MessageRequest(BaseModel):
    content: str


class ToolResponseRequest(BaseModel):
    id: str
    result: Any = None
    error: str | None = None


@router.post("/start")
async def start_session(request: StartRequest):
    session = agent_runner.create_session(request.prompt)
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
