"""
App configuration loaded from environment variables.
All secrets are read here — never hardcoded anywhere else.
"""

from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_key: str
    supabase_service_key: Optional[str] = None
    storage_bucket: str = "crop-images"

    # Database
    database_url: str

    # AI Model
    model_path: str = ""
    dev_mode: bool = False

    # CORS
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
