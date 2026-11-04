from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer)
    status = Column(String(50))   # ✅ FIXED


