from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.interview import Interview
from app.schemas.interview import InterviewCreate
from app.api.deps import get_db

router = APIRouter(prefix="/interviews", tags=["Interviews"])

@router.post("/")
def schedule_interview(data: InterviewCreate, db: Session = Depends(get_db)):
    interview = Interview(**data.dict(), status="scheduled")
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview

@router.post("/result/{interview_id}")
def update_result(interview_id: int, result: str, db: Session = Depends(get_db)):
    interview = db.query(Interview).get(interview_id)
    interview.status = result
    db.commit()
    return {"message": "Result updated"}