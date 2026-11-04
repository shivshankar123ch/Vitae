from pydantic import BaseModel


class PublicStats(BaseModel):
    active_job_seekers: int
    recruiters: int
    companies: int
    jobs_posted: int
