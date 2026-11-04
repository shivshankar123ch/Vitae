
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Date, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base




# -------------------------
# 🏢 COMPANY
# -------------------------
class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255))
    industry = Column(String(255), nullable=False)
    Position = Column(String(255))
    tier = Column(String(10))  # Tier 1 / 2 / 3
    founded_in = Column(Date)
    employe= Column(Integer)
    description =Column(String(255))
    skills_requirement= Column(String(255),nullable=True)
    profile_details = Column(JSON, nullable=True)

    is_active = Column(Boolean, default=True)
    is_blacklisted = Column(Boolean, default=False)
    is_whitelisted = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    recruiters = relationship("Recruiter", back_populates="company")
    history = relationship("HiringHistory", back_populates="company")
    status_logs = relationship("CompanyStatusLog", back_populates="company")


# -------------------------
# 👤 RECRUITER
# -------------------------
class Recruiter(Base):
    __tablename__ = "recruiters"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True)
    phone = Column(String(20))

    company_id = Column(Integer, ForeignKey("companies.id"))

    company = relationship("Company", back_populates="recruiters")


# -------------------------
# 📊 HIRING HISTORY
# -------------------------
class HiringHistory(Base):
    __tablename__ = "hiring_history"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"))

    year = Column(Integer)
    hires_count = Column(Integer)
    notes = Column(Text)

    company = relationship("Company", back_populates="history")


# -------------------------
# 🚫 STATUS LOG
# -------------------------
class CompanyStatusLog(Base):
    __tablename__ = "company_status_logs"

    id = Column(Integer, primary_key=True)

    company_id = Column(Integer, ForeignKey("companies.id"))

    status = Column(String(50))  # blacklist / whitelist
    reason = Column(Text)

    approved_by = Column(String(255))  # TPO/Admin
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="status_logs")


# -------------------------
# 📝 COMPANY REQUEST
# -------------------------
class CompanyRegistrationRequest(Base):
    __tablename__ = "company_requests"

    id = Column(Integer, primary_key=True)

    company_name = Column(String(255))
    industry = Column(String(255))
    tier = Column(String(10))

    contact_name = Column(String(255))
    contact_email = Column(String(255))

    status = Column(String(50), default="pending")  # pending / approved / rejected
    reviewed_by = Column(String(255))

    created_at = Column(DateTime, default=datetime.utcnow)