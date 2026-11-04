from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.core.database import Base


class RecruiterPlanPayment(Base):
    __tablename__ = "recruiter_plan_payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    recruiter_id = Column(
        Integer,
        ForeignKey("recruiter.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plan_name = Column(String(40), nullable=False)
    billing_cycle = Column(String(12), nullable=False)
    amount_paise = Column(Integer, nullable=False)
    razorpay_order_id = Column(String(80), nullable=False, unique=True, index=True)
    razorpay_payment_id = Column(String(80), unique=True, index=True)
    status = Column(String(20), nullable=False, default="created")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    paid_at = Column(DateTime)
    expires_at = Column(DateTime)
