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

        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        response = self.client.chat.completions.create(**kwargs)
        print(f"LLM response: {response}")
        return response

    def parse_tool_call(self, response) -> dict[str, Any] | None:
        message = response.choices[0].message

        if message.tool_calls:
            tool_call = message.tool_calls[0]
            import json
            return {
                "type": "tool",
                "id": tool_call.id,
                "name": tool_call.function.name,
                "arguments": json.loads(tool_call.function.arguments),
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
