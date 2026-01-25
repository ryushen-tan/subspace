import uuid
from typing import Any
from .openrouter import OpenRouterClient
from models.agent import Session, AgentState
from models.tool import ToolCall, ToolResponse
from tools import tool_registry, get_tool_schemas
from prompt.system import system_prompt
from config.settings import get_settings


class AgentRunner:
    def __init__(self):
        settings = get_settings()
        if settings.llm_provider == "gemini":
            from .gemini import GeminiClient
            self.client = GeminiClient()
        else:
            self.client = OpenRouterClient()
        self.sessions: dict[str, Session] = {}

    def create_session(self, user_prompt: str = "", system_prompt_override: str | None = None) -> Session:
        session_id = str(uuid.uuid4())
        system_content = system_prompt_override or system_prompt
        session = Session(
            id=session_id,
            user_prompt=user_prompt,
            history=[{"role": "system", "content": system_content}],
        )
        if user_prompt:
            session.history.append({"role": "user", "content": user_prompt})
        self.sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Session | None:
        return self.sessions.get(session_id)

    def add_message(self, session_id: str, role: str, content: str) -> None:
        session = self.sessions.get(session_id)
        if session:
            session.history.append({"role": role, "content": content})

    def inject_step_analysis(self, session_id: str, analysis: str) -> None:
        """Inject STEP file analysis into the agent's conversation history."""
        session = self.sessions.get(session_id)
        if session:
            analysis_message = f"The uploaded STEP file has been analyzed:\n\n{analysis}\n\nUse this information when working with the uploaded geometry."
            # Insert after system prompt but before user messages
            # Find the first user message or insert at position 1
            insert_pos = 1
            for i, msg in enumerate(session.history):
                if msg.get("role") == "user":
                    insert_pos = i
                    break
            session.history.insert(insert_pos, {"role": "system", "content": analysis_message})

    def notify_mesh_uploaded(self, session_id: str, file_type: str = "STL", filename: str = "", summary: str = "") -> None:
        """Notify the agent that a mesh file has been uploaded."""
        session = self.sessions.get(session_id)
        if session and session.state.mesh and session.state.mesh.vertices:
            vertex_count = len(session.state.mesh.vertices)
            face_count = len(session.state.mesh.faces)
            edge_count = len(session.state.mesh.edges)
            
            upload_message = f"A {file_type} file has been uploaded"
            if filename:
                upload_message += f" ({filename})"
            upload_message += f". The mesh contains {vertex_count} vertices"
            if face_count > 0:
                upload_message += f", {face_count} faces"
            if edge_count > 0:
                upload_message += f", and {edge_count} edges"
            upload_message += ". The mesh is now available in the session state."
            if summary:
                upload_message += f"\n\n{summary}"
            upload_message += "\n\nWhen the user asks about the uploaded file, use the inspect_mesh tool to examine the mesh structure and then describe what the object looks like based on the vertices, faces, and geometry."
            
            # Insert after system prompt but before user messages
            insert_pos = 1
            for i, msg in enumerate(session.history):
                if msg.get("role") == "user":
                    insert_pos = i
                    break
            session.history.insert(insert_pos, {"role": "system", "content": upload_message})

    def run_step(self, session_id: str) -> ToolResponse | None:
        session = self.sessions.get(session_id)
        if not session:
            return None

        settings = get_settings()
        if session.state.iteration >= settings.max_agent_iterations:
            return ToolResponse(
                id="max_iterations",
                error="Maximum iterations reached",
            )

        if session.state.finalized:
            return ToolResponse(
                id="finalized",
                result={"message": "Design already finalized"},
            )

        response = self.client.chat(
            messages=session.history,
            tools=get_tool_schemas(),
        )

        tool_call_data = self.client.parse_tool_call(response)

        if not tool_call_data:
            content = response.choices[0].message.content
            session.history.append({"role": "assistant", "content": content})
            return ToolResponse(id="no_tool", result={"message": content})

        # Handle JSON parse errors from LLM
        if tool_call_data.get("type") == "error":
            session.state.task_complete = True
            return ToolResponse(id=tool_call_data.get("id", "json_error"), error=tool_call_data.get("error"))

        tool_call = ToolCall(**tool_call_data)
        tool = tool_registry.get(tool_call.name)

        if not tool:
            tool_response = ToolResponse(
                id=tool_call.id,
                error=f"Unknown tool: {tool_call.name}",
            )
        else:
            try:
                result = tool.execute(session.state, **tool_call.arguments)
                tool_response = ToolResponse(id=tool_call.id, result=result)
            except Exception as e:
                tool_response = ToolResponse(id=tool_call.id, error=str(e))

        import json
        session.history.append({
            "role": "assistant",
            "content": None,
            "tool_calls": [{
                "id": tool_call.id,
                "type": "function",
                "function": {
                    "name": tool_call.name,
                    "arguments": json.dumps(tool_call.arguments) if isinstance(tool_call.arguments, dict) else tool_call.arguments,
                },
            }],
        })
        session.history.append({
            "role": "tool",
            "tool_call_id": tool_call.id,
            "content": str(tool_response.result or tool_response.error),
        })

        session.state.iteration += 1
        return tool_response

    def run_until_complete(self, session_id: str) -> list[ToolResponse]:
        responses = []
        settings = get_settings()

        while True:
            session = self.sessions.get(session_id)
            if not session:
                break

            if session.state.finalized:
                break

            if session.state.iteration >= settings.max_agent_iterations:
                break

            response = self.run_step(session_id)
            if response:
                responses.append(response)

            if response and response.error:
                break

        return responses
