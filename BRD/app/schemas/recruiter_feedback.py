from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RecruiterFeedbackOut(BaseModel):
    id: int
    recruiter_name: str
    comment: str
    image_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
