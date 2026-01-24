from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    llm_provider: str = "openrouter" # "gemini" or "openrouter"
    openrouter_api_key: str | None = None
    gemini_api_key: str | None = None
    openrouter_model: str = "google/gemini-3-flash-preview"
    gemini_model: str = "gemini-3-flash-preview"
    openrouter_max_tokens: int = 24000
    max_agent_iterations: int = 20

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
