from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    openrouter_api_key: str
    openrouter_model: str = "google/gemini-3-flash-preview"
    openrouter_max_tokens: int = 64
    max_agent_iterations: int = 20

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
