from abc import ABC, abstractmethod
from typing import Any
from models.agent import AgentState

tool_registry: dict[str, "Tool"] = {}


class Tool(ABC):
    name: str
    description: str
    parameters: dict[str, Any]

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        if hasattr(cls, "name") and cls.name:
            tool_registry[cls.name] = cls()

    @abstractmethod
    def execute(self, state: AgentState, **kwargs) -> dict[str, Any]:
        pass

    def schema(self) -> dict:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


def get_tool_schemas() -> list[dict]:
    return [tool.schema() for tool in tool_registry.values()]
