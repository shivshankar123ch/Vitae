from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
)
from sqlalchemy.orm import relationship

from datetime import datetime

from app.core.database import Base


class User(Base):
    __tablename__ = "recruiter"

    # =====================================================
    # PRIMARY KEY
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    # =====================================================
    # USERNAME
    # =====================================================

    username = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    # =====================================================
    # EMAIL
    # =====================================================

    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    # =====================================================
    # HASHED PASSWORD
    # =====================================================

    hashed_password = Column(
        String(255),
        nullable=False,
    )

    # =====================================================
    # CREATED AT
    # =====================================================

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    feedback = relationship(
        "RecruiterFeedback",
        back_populates="recruiter",
        cascade="all, delete-orphan",
    )

    # =====================================================
    # STRING REPRESENTATION
    # =====================================================

    def __repr__(self):
        return (
            f"<User(id={self.id}, "
            f"username='{self.username}', "
            f"email='{self.email}')>"
        )