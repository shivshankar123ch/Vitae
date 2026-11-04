from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.offer import Offer
from app.schemas.offer import OfferCreate
from app.api.deps import get_db

router = APIRouter(prefix="/offers", tags=["Offers"])

@router.post("/")
def create_offer(data: OfferCreate, db: Session = Depends(get_db)):
    offer = Offer(**data.dict(), status="offered")
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer

@router.post("/accept/{offer_id}")
def accept_offer(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(Offer).get(offer_id)
    offer.status = "accepted"
    db.commit()
    return {"message": "Offer accepted"}

@router.post("/reject/{offer_id}")
def reject_offer(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(Offer).get(offer_id)
    offer.status = "rejected"
    db.commit()
    return {"message": "Offer rejected"}