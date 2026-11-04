from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer)
    round = Column(String(50))    # ✅ FIXED
    status = Column(String(50))   # ✅ (fix this too if not already)