from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "UEP Hiring System"
    debug: bool = True
    database_url: str = Field(...)
    secret_key: str = Field(..., min_length=32)
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    upload_dir: str = "uploads"

    llm_provider: Literal["gemini", "groq", "ollama", "fake"] = "gemini"
    llm_api_key: str = ""
    llm_model: str = "gemini-2.5-flash"
    llm_base_url: str = ""
    llm_timeout_seconds: float = 30
    mock_interview_daily_sessions: int = 5
    mock_interview_daily_answers: int = 50


settings = Settings()
