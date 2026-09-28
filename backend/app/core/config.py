from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Nexgile-TravAI Backend"
    API_V1_STR: str = "/api/v1"
    
    # MongoDB Configuration
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "nexgile_travai"
    
    # JWT Security Configuration
    JWT_SECRET: str = "nexgile_travai_jwt_secret_key_change_in_production_2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME: Optional[str] = ""
    CLOUDINARY_API_KEY: Optional[str] = ""
    CLOUDINARY_API_SECRET: Optional[str] = ""
    CLOUDINARY_FOLDER: str = "pgmadeeazy"
    CLOUDINARY_MAX_SIZE: int = 10485760  # 10 MB in bytes
    CLOUDINARY_ALLOWED_TYPES: Union[List[str], str] = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]

    # PayPal Configuration
    PAYPAL_CLIENT_ID: Optional[str] = "AeUZfiOiCnkMD9yws8LPCDPAHTH2U1Lg0BIZPVDZofCKkjSi1Av805VMzC8QGw3r2LYfXhYoK4tURZCo"
    PAYPAL_CLIENT_SECRET: Optional[str] = "EIAsQipLcF6_72n5wR6YUi0kLuFVAgboxMPcitD92X59-zAF81WaXVl3Tj6WA0XIrem1p1LOwaDzWTdQ"
    PAYPAL_MODE: str = "sandbox"
    PAYPAL_BASE_URL: str = "https://api-m.sandbox.paypal.com"


    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173"]

    @field_validator("CLOUDINARY_ALLOWED_TYPES", mode="before")
    @classmethod
    def parse_allowed_types(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["image/jpeg", "image/png", "image/webp"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
