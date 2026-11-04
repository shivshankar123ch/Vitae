from sqlalchemy import (
    Column,
    JSON,
    Integer,
    String,
    Float,
    Date,
    ForeignKey,
    LargeBinary,
)

from sqlalchemy.orm import relationship

from app.core.database import Base


# =========================================================
# STUDENT
# =========================================================

class Student(Base):

    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(20))
    branch = Column(String(100))

    cgpa = Column(Float)
    backlogs = Column(Integer)
    batch_year = Column(Integer)

    skill_name = Column(String(255))

    title = Column(String(255))
    description = Column(String(500))
    tech_stack = Column(String(255))

    resume = Column(String(255))
    resume_data = Column(LargeBinary)
    resume_filename = Column(String(255))
    resume_content_type = Column(String(120))
    profile_details = Column(JSON, nullable=True)

    experiences = relationship(
        "Experience",
        back_populates="student",
        cascade="all, delete"
    )


# =========================================================
# EXPERIENCE
# =========================================================

class Experience(Base):

    __tablename__ = "experiences"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("students.id")
    )

    company = Column(String(255))

    role = Column(String(255))

    experience = Column(String(100))

    start_date = Column(Date)

    end_date = Column(Date)

    student = relationship(
        "Student",
        back_populates="experiences"
    )