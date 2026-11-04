from fastapi import APIRouter

from app.api.routes import (
    stu_profile_registration,
    student,
    company,
    job,
    # application,
    interview,
    offer,
    notification,
    reports,
    recruiter,
    recruiter_billing,
    recruiter_feedback,
    stats,
    otp,
)

router = APIRouter()
router.include_router(stu_profile_registration.router, prefix="/stu_profile_registration", tags=["stu_profile_registration"])
router.include_router(recruiter.router, prefix="/recruiter", tags=["recruiter"])
router.include_router(recruiter_billing.router, prefix="/recruiter", tags=["Recruiter billing"])
router.include_router(recruiter_feedback.router, prefix="/public", tags=["Recruiter feedback"])
router.include_router(student.router, prefix="/students", tags=["Students"])
router.include_router(company.router, prefix="/company", tags=["Companies"])
router.include_router(job.router, prefix="/jobs", tags=["Jobs"])
# router.include_router(application.router, prefix="/applications", tags=["Applications"])
router.include_router(interview.router, prefix="/interviews", tags=["Interviews"])
router.include_router(offer.router, prefix="/offers", tags=["Offers"])
router.include_router(notification.router, prefix="/notifications", tags=["Notifications"])
router.include_router(reports.router, prefix="/reports", tags=["Reports"])
router.include_router(stats.router, prefix="/public", tags=["Public"])
router.include_router(otp.router)