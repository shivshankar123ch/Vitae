from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.core.database import Base


class OtpChallenge(Base):
    __tablename__ = "otp_challenges"

    id = Column(String(36), primary_key=True, index=True)
    email_hash = Column("phone_hash", String(64), nullable=False, index=True)
    otp_hash = Column("provider_session_id", String(255), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, nullable=False, default=0)
    verified_at = Column(DateTime, nullable=True)
