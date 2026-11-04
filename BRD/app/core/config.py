import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parents[2] / ".env")


class Settings:
    PROJECT_NAME = "Placement ERP"
    DATABASE_URL = os.getenv("DATABASE_URL")
    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID") or os.getenv("RAZORPAY_API_KEY")
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET") or os.getenv(
        "RAZORPAY_API_SECRET_KEY"
    )
    PLAN_ADMIN_USERNAME = os.getenv("PLAN_ADMIN_USERNAME")
    PLAN_ADMIN_PASSWORD = os.getenv("PLAN_ADMIN_PASSWORD")
    PLAN_ADMIN_JWT_SECRET = os.getenv("PLAN_ADMIN_JWT_SECRET")
    RESEND_API_KEY = os.getenv("RESEND_API_KEY")
    RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL")
    OTP_SESSION_SECRET = os.getenv("OTP_SESSION_SECRET")
    OTP_COOKIE_SECURE = os.getenv("OTP_COOKIE_SECURE", "false").strip().lower() in {
        "1",
        "true",
        "yes",
    }
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        ).split(",")
        if origin.strip()
    ]

    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not configured. Set it in the project .env file "
            "or in the environment."
        )


settings = Settings()
