from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """从环境变量加载的应用配置设置。"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

    # Application
    APP_NAME: str = "IP-NFT Management API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ipnft_db"
    DATABASE_SYNC_URL: str = "postgresql://postgres:postgres@localhost:5432/ipnft_db"
    
    # JWT - 必须从环境变量读取，无默认值
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS - 使用 List[str] 以兼容 Python 3.8+
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # IPFS
    IPFS_API_URL: str = "http://localhost:5001"
    
    # Blockchain
    WEB3_PROVIDER_URL: str = "https://polygon-mumbai.g.alchemy.com/v2/your-api-key"
    CONTRACT_ADDRESS: str = ""
    
    # Email Service Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    EMAIL_FROM_NAME: str = "IP-NFT Platform"
    
    # Frontend URL for email links
    FRONTEND_URL: str = "http://localhost:5173"


@lru_cache()
def get_settings() -> Settings:
    """获取缓存的配置实例。"""
    return Settings()


settings = get_settings()
