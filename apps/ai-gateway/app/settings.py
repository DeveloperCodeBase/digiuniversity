"""Runtime settings, loaded from environment variables."""

from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Resolved configuration for the AI gateway."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # mock = canned responses, no network. external_api = forward to provider.
    ai_mode: Literal["mock", "external_api"] = "mock"

    # Used when ai_mode=external_api.
    ai_services_base_url: str = "https://future-gpu-server.example.com"
    ai_services_api_key: str = "change-me"
    ai_timeout_seconds: float = 120.0

    # Service identity surfaced from /v1/health.
    service_name: str = "ai-gateway"
    service_version: str = "0.1.0"


settings = Settings()
