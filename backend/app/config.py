import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    nova_model_id: str = "amazon.nova-pro-v1:0"
    nova_lite_model_id: str = "amazon.nova-lite-v1:0"
    use_mock: bool = True
    cors_origins: str = "*"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
