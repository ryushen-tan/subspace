from openai import OpenAI
from typing import Any
from config.settings import get_settings


class OpenRouterClient:
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
        )
        self.model = settings.openrouter_model
        self.max_tokens = settings.openrouter_max_tokens
        self.include_reasoning = settings.openrouter_include_reasoning
        self.reasoning_effort = settings.openrouter_reasoning_effort

    def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict] | None = None,
        json_mode: bool = True,
    ) -> dict[str, Any]:
        kwargs = {
            "model": self.model,
            "messages": messages,
            "max_tokens": self.max_tokens,
        }

        extra_body = {}
        if self.include_reasoning is not None:
            extra_body["include_reasoning"] = self.include_reasoning
        if self.reasoning_effort:
            extra_body["reasoning"] = {"effort": self.reasoning_effort}

        if extra_body:
            kwargs["extra_body"] = extra_body

        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        response = self.client.chat.completions.create(**kwargs)
        print(f"LLM response: {response}")
        return response

    def chat_with_image(
        self,
        image_base64: str,
        prompt: str,
    ) -> str:
        """
        Send an image to Gemini via OpenRouter and get a text response.
        
        Args:
            image_base64: Base64-encoded PNG image
            prompt: Text prompt to send with the image
        
        Returns:
            Response text from the model
        """
        # Format message for vision model (Gemini format)
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_base64}"
                        }
                    }
                ]
            }
        ]
        
        kwargs = {
            "model": self.model,
            "messages": messages,
            "max_tokens": self.max_tokens,
        }

        extra_body = {}
        if self.include_reasoning is not None:
            extra_body["include_reasoning"] = self.include_reasoning
        if self.reasoning_effort:
            extra_body["reasoning"] = {"effort": self.reasoning_effort}

        if extra_body:
            kwargs["extra_body"] = extra_body
        
        # Don't use json_mode for vision requests
        response = self.client.chat.completions.create(**kwargs)
        return response.choices[0].message.content

    def parse_tool_call(self, response) -> dict[str, Any] | None:
        message = response.choices[0].message

        if message.tool_calls:
            tool_call = message.tool_calls[0]
            import json
            try:
                arguments = json.loads(tool_call.function.arguments)
            except json.JSONDecodeError as e:
                print(f"JSON parse error: {e}")
                return {
                    "type": "error",
                    "id": tool_call.id,
                    "error": f"Invalid JSON from LLM: {str(e)[:100]}",
                }
            return {
                "type": "tool",
                "id": tool_call.id,
                "name": tool_call.function.name,
                "arguments": arguments,
            }

        if message.content:
            import json
            try:
                content = json.loads(message.content)
                if content.get("type") == "tool":
                    return content
            except json.JSONDecodeError:
                pass

        return None
