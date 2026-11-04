from pydantic import BaseModel, EmailStr, Field
from typing import Any, Dict, Optional, List
from datetime import date


# -------------------------
# RECRUITER
# -------------------------
class RecruiterBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str]


class RecruiterOut(RecruiterBase):
    id: int

    class Config:
        from_attributes = True


# -------------------------
# COMPANY
# -------------------------
class CompanyCreate(BaseModel):
    name: Optional[str] = None
    industry: str
    Position: Optional[str] = None
    tier: Optional[str] = None
    founded_in: Optional[date] = None
    employe: Optional[int] = None
    description: Optional[str] = None
    skills_requirement: Optional[str] = None
    profile_details: Dict[str, Any] = Field(default_factory=dict)


class CompanyOut(BaseModel):
    id: int
    name: Optional[str] = None
    industry: Optional[str]
    tier: Optional[str]
    is_blacklisted: bool
    is_whitelisted: bool

    recruiters: List[RecruiterOut] = []

    class Config:
        from_attributes = True


# -------------------------
# HIRING HISTORY
# -------------------------
class HiringHistoryCreate(BaseModel):
    year: int
    hires_count: int
    notes: Optional[str]


# -------------------------
# STATUS UPDATE
# -------------------------
class StatusUpdate(BaseModel):
    status: str  # blacklist / whitelist
    reason: str
    approved_by: str


# -------------------------
# COMPANY REQUEST
# -------------------------
class CompanyRequestCreate(BaseModel):
    company_name: str
    industry: str
    tier: str
    contact_name: str
    contact_email: EmailStr