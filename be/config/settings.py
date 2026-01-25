from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )
    llm_provider: str = "openrouter" # "gemini" or "openrouter"
    openrouter_api_key: str | None = None
    gemini_api_key: str | None = None
    elevenlabs_api_key: str | None = None
    openrouter_model: str = "google/gemini-3-pro-preview"
    gemini_model: str = "gemini-3-flash-preview"
    openrouter_max_tokens: int = 24000
    max_agent_iterations: int = 20
    
    # PocketBase configuration
    pocketbase_url: str = "http://127.0.0.1:8090"  # PocketBase server URL

    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache
def get_settings() -> Settings:
    return Settings()
