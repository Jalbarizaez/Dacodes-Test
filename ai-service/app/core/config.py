"""
Configuration management using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    PROJECT_NAME: str = "DaCodes AI Service"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    
    # API
    API_V1_PREFIX: str = "/ai/v1"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Security
    API_KEY: str = "your-secret-api-key-change-in-production"
    
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/dacodes_inventory"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_FORECAST: int = 86400  # 24 hours
    CACHE_TTL_SUPPLIER_SCORE: int = 604800  # 7 days
    CACHE_TTL_WASTE: int = 43200  # 12 hours
    
    # S3 / Object Storage
    S3_BUCKET: str = "dacodes-ai-models"
    S3_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    
    # ML Models
    MODEL_PATH: str = "/app/models"
    ENABLE_GPU: bool = False
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # Performance
    MAX_WORKERS: int = 4
    REQUEST_TIMEOUT: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
