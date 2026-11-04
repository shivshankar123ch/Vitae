from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


# -------------------------
# 🏢 COMPANY DRIVE (JOB)
# -------------------------
class Drive(Base):
    __tablename__ = "drives"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255))  # Software Engineer
    company_id = Column(Integer, ForeignKey("companies.id"))
    recruiter_id = Column(Integer, ForeignKey("recruiter.id"), nullable=True, index=True)

    ctc = Column(Float)  # salary
    stipend = Column(Float)

    location = Column(String(255))
    drive_type = Column(String(50))  # On-campus / Off-campus / Pool
    profile_details = Column(JSON, nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # RELATIONS
    eligibility = relationship("DriveEligibility", back_populates="drive", uselist=False)
    rounds = relationship("DriveRound", back_populates="drive")
    applications = relationship("Application", back_populates="drive")


# -------------------------
# 🎯 ELIGIBILITY RULES
# -------------------------
class DriveEligibility(Base):
    __tablename__ = "drive_eligibility"

    id = Column(Integer, primary_key=True)

    drive_id = Column(Integer, ForeignKey("drives.id"))

    min_cgpa = Column(Float)
    allowed_branches = Column(String(255))  # CSV: CSE,IT,ECE
    max_backlogs = Column(Integer)
    batch_year = Column(Integer)

    drive = relationship("Drive", back_populates="eligibility")


# -------------------------
# 🔄 DRIVE ROUNDS
# -------------------------
class DriveRound(Base):
    __tablename__ = "drive_rounds"

    id = Column(Integer, primary_key=True)

    drive_id = Column(Integer, ForeignKey("drives.id"))

    name = Column(String(100))  # Aptitude / Technical / HR
    order = Column(Integer)  # 1,2,3
    is_elimination = Column(Boolean, default=True)

    drive = relationship("Drive", back_populates="rounds")


# -------------------------
# 🎓 STUDENT APPLICATION
# -------------------------
class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True)

    student_id = Column(Integer)  # you can link Student table later
    drive_id = Column(Integer, ForeignKey("drives.id"))

    status = Column(String(50), default="applied")  
    # applied / shortlisted / rejected / selected

    current_round = Column(Integer, default=0)

    drive = relationship("Drive", back_populates="applications")