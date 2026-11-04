from pydantic import BaseModel


class InterviewCreate(BaseModel):
    name: str
    email: str
    cgpa: str
    skills: str

class InterviewOut(InterviewCreate):
    id: int

    class Config:
        from_attributes = True