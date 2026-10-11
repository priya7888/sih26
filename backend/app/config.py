import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "SafetyAI - AI-Powered Safety Intelligence Platform"
    TAGLINE: str = "AI-Powered SIF Precursor Detection & Safety Intelligence"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./safety_intelligence.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "safety-ai-sih-2026-secret-key-ps165")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Email Notification Channel (Configurable SMTP)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAILS_FROM_EMAIL: str = os.getenv("EMAILS_FROM_EMAIL", "alerts@safetyai.com")
    EMAIL_ENABLED: bool = os.getenv("EMAIL_ENABLED", "false").lower() in ["1", "true", "yes"]

    # Web Push Notification Channel (Configurable VAPID)
    VAPID_PUBLIC_KEY: str = os.getenv("VAPID_PUBLIC_KEY", "")
    VAPID_PRIVATE_KEY: str = os.getenv("VAPID_PRIVATE_KEY", "")
    VAPID_CLAIM_EMAIL: str = os.getenv("VAPID_CLAIM_EMAIL", "admin@safetyai.com")

settings = Settings()
