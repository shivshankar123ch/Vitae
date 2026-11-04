from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.company import Company
from app.models.job import Drive
from app.models.recruiter import User as RecruiterUser
from app.models.stu_profile_registration import User as StudentUser
from app.schemas.stats import PublicStats


router = APIRouter()


@router.get("/stats", response_model=PublicStats)
def get_public_stats(db: Session = Depends(get_db)) -> PublicStats:
    return PublicStats(
        active_job_seekers=db.query(StudentUser).count(),
        recruiters=db.query(RecruiterUser).count(),
        companies=db.query(Company)
        .filter(
            Company.is_active.is_(True),
            Company.is_blacklisted.is_(False),
        )
        .count(),
        jobs_posted=db.query(Drive).count(),
    )
