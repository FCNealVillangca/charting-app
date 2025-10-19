from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    PROJECT_NAME: str = "Trading Chart API"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",  # Vite default port
        "http://localhost:3000",  # Alternative frontend port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    # Database configuration
    DATABASE_URL: str = "sqlite:///./charting_app.db"
    
    # Data configuration (CSV only - drawings now in SQLite)
    CSV_FILE_PATH: Path = Path(__file__).parent.parent / "EURUSD_15m_1year.csv"
    
    # Pagination defaults
    DEFAULT_PAGE_LIMIT: int = 500
    MAX_PAGE_LIMIT: int = 5000
    
    class Config:
        case_sensitive = True


settings = Settings()

