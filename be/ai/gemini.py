from google import genai
from google.genai import types
from typing import Any
import json
import uuid
from config.settings import get_settings


class GeminiResponse:
    def __init__(self, content: str | None = None):
        self.choices = [
            type('Choice', (), {
                'message': type('Message', (), {
                    'content': content,
                    'tool_calls': None
                })
            })
        ]

class GeminiClient:
    def __init__(self):
        settings = get_settings()
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model_name = settings.gemini_model
        self.max_tokens = settings.openrouter_max_tokens

    def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict] | None = None,
        json_mode: bool = True,
    ) -> Any:
        # Convert messages to Gemini format
        contents = []
        system_instruction = None
        
        for msg in messages:
            role = msg["role"]
            content = msg.get("content")
            
            if role == "system":
                system_instruction = content
            elif role == "assistant" and msg.get("tool_calls"):
                parts = []
                for tc in msg["tool_calls"]:
                    args = tc["function"]["arguments"]
                    if isinstance(args, str):
                        try:
                            args = json.loads(args)
                        except:
                            args = {}
                    if not isinstance(args, dict):
                        args = {}
                    parts.append(types.Part.from_function_call(
                        name=tc["function"]["name"],
                        args=args
                    ))
                contents.append(types.Content(role="model", parts=parts))
            elif role == "tool":
                contents.append(types.Content(
                    role="user",
                    parts=[types.Part.from_function_response(
                        name=msg.get("name", "unknown"),
                        response={"result": content if content else ""}
                    )]
                ))
            else:
                gemini_role = "user" if role == "user" else "model"
                if content:
                    contents.append(types.Content(role=gemini_role, parts=[types.Part.from_text(text=content)]))

        config_kwargs = {
            "max_output_tokens": self.max_tokens,
            "system_instruction": system_instruction,
        }
        
        if json_mode:
            config_kwargs["response_mime_type"] = "application/json"

        if tools:
            gemini_tools = []
            for tool in tools:
                if "function" in tool:
                    f = tool["function"]
                    gemini_tools.append(types.Tool(
                        function_declarations=[types.FunctionDeclaration(
                            name=f["name"],
                            description=f["description"],
                            parameters=f["parameters"]
                        )]
                    ))
                else:
                    gemini_tools.append(tool)
            config_kwargs["tools"] = gemini_tools

        config = types.GenerateContentConfig(**config_kwargs)
        
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=contents,
            config=config
        )
        
        print(f"LLM response: {response}")
        
        # Wrap response to mimic OpenAI
        if not self.parse_tool_call(response):
            return GeminiResponse(response.text)
            
        return response

    def parse_tool_call(self, response) -> dict[str, Any] | None:
        if hasattr(response, "choices"): # Already wrapped or OpenAI response
            return None

        if not response.candidates:
            return None
            
        candidate = response.candidates[0]
        parts = candidate.content.parts
        
        for part in parts:
            if part.function_call:
                call = part.function_call
                return {
                    "type": "tool",
                    "id": f"call_{uuid.uuid4().hex[:12]}",
                    "name": call.name,
                    "arguments": call.args,
                }

        if candidate.content.parts[0].text:
            try:
                content = json.loads(candidate.content.parts[0].text)
                if content.get("type") == "tool":
                    return content
            except:
                pass

        return None
