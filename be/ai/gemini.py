from google import genai
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
        # Extract system instruction and user message from messages
        system_instruction = None
        user_message = None
        
        for msg in messages:
            if msg["role"] == "system":
                system_instruction = msg.get("content")
            elif msg["role"] == "user":
                user_message = msg.get("content")
        
        if not user_message:
            return GeminiResponse("No user message provided")

        try:
            # Build the request with system instruction if provided
            if system_instruction:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=user_message,
                    config=genai.types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        max_output_tokens=self.max_tokens,
                    )
                )
            else:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=user_message,
                    config=genai.types.GenerateContentConfig(
                        max_output_tokens=self.max_tokens,
                    )
                )
            
            # Extract text from response
            if response and response.text:
                return GeminiResponse(response.text)
            else:
                return GeminiResponse("No response from model")
                
        except Exception as e:
            print(f"Gemini API error: {e}")
            return GeminiResponse(f"Error: {str(e)}")

    def parse_tool_call(self, response) -> dict[str, Any] | None:
        """Parse tool calls from response (if needed)"""
        if hasattr(response, "choices"):  # Already wrapped or OpenAI response
            return None
