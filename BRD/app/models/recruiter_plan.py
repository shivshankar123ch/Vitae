from sqlalchemy import Boolean, Column, Integer, JSON, String

from app.core.database import Base


class RecruiterPlan(Base):
    __tablename__ = "recruiter_plans"

    name = Column(String(40), primary_key=True)
    subtitle = Column(String(120), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    featured = Column(Boolean, nullable=False, default=False)

    job_postings = Column(String(80), nullable=False)
    salary_limit = Column(String(80), nullable=False)
    monthly_unlock_credits = Column(String(80), nullable=False)
    monthly_price_rupees = Column(Integer, nullable=False)
    monthly_billing_label = Column(String(20), nullable=False, default="mo")
    annual_unlock_credits = Column(String(80), nullable=False)
    annual_price_rupees = Column(Integer)
    recruiter_seats = Column(Integer, nullable=False)
    features = Column(JSON, nullable=False, default=dict)
