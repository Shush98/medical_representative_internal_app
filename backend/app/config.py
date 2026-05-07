from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    CORS_ORIGINS: str = "http://localhost:5173"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
