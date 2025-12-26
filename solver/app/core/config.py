"""Application configuration using Pydantic settings."""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings."""
    
    # Server
    PORT: int = 8000
    DEBUG: bool = False
    ENV: str = "development"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5000", "http://localhost:5173"]
    
    # Solver defaults
    DEFAULT_TIMEOUT: int = 300
    DEFAULT_MAX_SOLUTIONS: int = 5
    DEFAULT_NUM_WORKERS: int = 4
    
    # Constraint weights
    WEIGHT_FACULTY_LOAD: int = 5
    WEIGHT_CONSECUTIVE_CLASSES: int = 5
    WEIGHT_STUDENT_LOAD: int = 7
    WEIGHT_EVEN_DISTRIBUTION: int = 4
    WEIGHT_ROOM_UTILIZATION: int = 3
    WEIGHT_IDLE_GAPS: int = 5
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
