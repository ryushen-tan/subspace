from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Any
import json
from ai.agent import AgentRunner
from services.mesh_service import MeshService

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
                agent_runner.add_message(session_id, "user", content)
                response = agent_runner.run_step(session_id)
                await websocket.send_json({
                    "type": "response",
                    "response": response.model_dump() if response else None,
                    "state": session.state.model_dump(),
                })
                continue

            if message_type == "tool_response":
                tool_id = payload.get("id")
                if not tool_id:
                    await websocket.send_json({"type": "error", "message": "Missing tool id"})
                    continue
                session.history.append({
                    "role": "tool",
                    "tool_call_id": tool_id,
                    "content": str(payload.get("result") or payload.get("error")),
                })
                await websocket.send_json({"type": "ack", "id": tool_id})
                continue

            if message_type == "state":
                await websocket.send_json({"type": "state", "state": session.state.model_dump()})
                continue

            await websocket.send_json({"type": "error", "message": "Unknown message type"})
    except WebSocketDisconnect:
        return
