from pydantic import BaseModel, EmailStr, Field
from typing import Any, Dict, List, Optional
from datetime import date
from app.api.deps import get_db


# =========================================================
# EXPERIENCE SCHEMA
# =========================================================

class ExperienceBase(BaseModel):

    company: str
    role: str
    experience: str

    start_date: date
    end_date: date


class ExperienceResponse(ExperienceBase):

    id: int
    student_id: int

    class Config:
        from_attributes = True


# =========================================================
# STUDENT BASE SCHEMA
# =========================================================

class StudentBase(BaseModel):

    # PERSONAL INFO

    name: str
    email: EmailStr
    phone: str
    branch: str

    cgpa: float
    backlogs: int
    batch_year: int

    # SKILLS

    skill_name: str

    # PROJECTS

    title: str
    description: str
    tech_stack: str


# =========================================================
# CREATE STUDENT
# =========================================================

class StudentCreate(StudentBase):

    experiences: List[ExperienceBase] = Field(default_factory=list)


# =========================================================
# UPDATE STUDENT
# =========================================================

class StudentUpdate(BaseModel):

    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    branch: Optional[str] = None

    cgpa: Optional[float] = None
    backlogs: Optional[int] = None
    batch_year: Optional[int] = None

    skill_name: Optional[str] = None

    title: Optional[str] = None
    description: Optional[str] = None
    tech_stack: Optional[str] = None

    resume: Optional[str] = None
    profile_details: Optional[Dict[str, Any]] = None


# =========================================================
# STUDENT RESPONSE
# =========================================================

class StudentResponse(StudentBase):

    id: int

    resume: Optional[str] = None

    experiences: List[ExperienceResponse] = []
    profile_details: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True
        
class Token(BaseModel):

    access_token: str
    token_type: str


class TokenData(BaseModel):

    email: str | None = None