from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.recruiter import User


class RecruiterFeedback(Base):
    __tablename__ = "recruiter_feedback"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    recruiter_id = Column(
        Integer,
        ForeignKey("recruiter.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    comment = Column(String(1000), nullable=False)
    image_path = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    recruiter = relationship(User, back_populates="feedback")
