from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional


# -------------------------
# 🎯 ELIGIBILITY
# -------------------------
class EligibilityCreate(BaseModel):
    min_cgpa: float
    allowed_branches: str
    max_backlogs: int
    batch_year: int


# -------------------------
# 🔄 ROUND
# -------------------------
class RoundCreate(BaseModel):
    name: str
    order: int
    is_elimination: bool = True


# -------------------------
# 🚀 DRIVE CREATE
# -------------------------
class DriveCreate(BaseModel):
    title: str
    company_id: int
    ctc: Optional[float]
    stipend: Optional[float] = None
    location: str
    drive_type: str
    is_active: bool = True
    profile_details: Dict[str, Any] = Field(default_factory=dict)

    eligibility: EligibilityCreate
    rounds: List[RoundCreate]


# -------------------------
# 📤 RESPONSE
# -------------------------
class DriveResponse(BaseModel):
    id: int
    title: str
    location: str
    drive_type: str

    class Config:
        from_attributes = True