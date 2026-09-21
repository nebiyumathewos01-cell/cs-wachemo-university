from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ─── App ──────────────────────────────────────────────────
    APP_NAME: str = "CS Wachemo University API"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # ─── Database ─────────────────────────────────────────────
    DATABASE_URL: str

    # ─── JWT ──────────────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # ─── Gemini AI ────────────────────────────────────────────
    GEMINI_API_KEY: str = ""

    # ─── File Storage ─────────────────────────────────────────
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 50

    # ─── CORS ─────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # ─── Admin Seed ───────────────────────────────────────────
    ADMIN_EMAIL: str = "neba@gmail.com"
    ADMIN_USERNAME: str = "Neba"
    ADMIN_PASSWORD: str = "CS3RD"
    ADMIN_FULL_NAME: str = "Nebiyu Mathewos"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
