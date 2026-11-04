from pydantic import BaseModel


class OfferCreate(BaseModel):
    application_id: int


class OfferOut(BaseModel):
    id: int
    application_id: int
    status: str


