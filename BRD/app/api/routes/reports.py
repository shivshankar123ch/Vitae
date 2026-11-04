from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.student import Student
from app.models.offer import Offer
from app.api.deps import get_db


router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/placement-rate")
def placement_rate(db: Session = Depends(get_db)):
    total = db.query(Student).count()
    placed = db.query(Offer).filter(Offer.status == "accepted").count()

    rate = (placed / total * 100) if total else 0
    return {"placement_rate": rate}

@router.get("/offers")
def offer_stats(db: Session = Depends(get_db)):
    return db.query(Offer).all()