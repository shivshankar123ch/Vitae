from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.models.company import Company
from app.models.job import Drive,DriveEligibility,DriveRound,Application
from app.models.recruiter import User as Recruiter
from app.schemas.job import DriveCreate,DriveResponse
from app.api.deps import get_db
from app.api.routes.recruiter_billing import get_current_recruiter


router = APIRouter(prefix="/Posting", tags=["Jobs"])

@router.get("/drives")
def get_public_drives(db: Session = Depends(get_db)):
    drives = (
        db.query(Drive, Company)
        .join(Company, Drive.company_id == Company.id)
        .filter(
            Drive.is_active.is_(True),
            Company.is_active.is_(True),
        )
        .order_by(Drive.created_at.desc())
        .all()
    )

    response = []
    for drive, company in drives:
        eligibility = (
            db.query(DriveEligibility)
            .filter(DriveEligibility.drive_id == drive.id)
            .first()
        )
        rounds = (
            db.query(DriveRound)
            .filter(DriveRound.drive_id == drive.id)
            .order_by(DriveRound.order)
            .all()
        )
        profile_details = drive.profile_details or {}
        if not isinstance(profile_details, dict):
            profile_details = {}

        # Recruiter contact details are private; expose job details only.
        public_profile_details = {
            key: value
            for key, value in profile_details.items()
            if key.lower() not in {"contact_name", "contact_email", "contact_phone"}
        }
        response.append(
            {
                "id": drive.id,
                "title": drive.title,
                "company_id": company.id,
                "company_name": company.name or company.industry,
                "industry": company.industry,
                "company_description": company.description,
                "company_details": {
                    key: value
                    for key, value in (company.profile_details or {}).items()
                    if key in {"website", "headquarters"}
                } if isinstance(company.profile_details, dict) else {},
                "location": drive.location,
                "drive_type": drive.drive_type,
                "ctc": drive.ctc,
                "stipend": drive.stipend,
                "profile_details": public_profile_details,
                "about_the_job": (
                    public_profile_details.get("about_the_job")
                    or public_profile_details.get("job_description")
                ),
                "eligibility": (
                    {
                        "min_cgpa": eligibility.min_cgpa,
                        "allowed_branches": eligibility.allowed_branches,
                        "max_backlogs": eligibility.max_backlogs,
                        "batch_year": eligibility.batch_year,
                    }
                    if eligibility
                    else None
                ),
                "rounds": [
                    {
                        "name": interview_round.name,
                        "order": interview_round.order,
                        "is_elimination": interview_round.is_elimination,
                    }
                    for interview_round in rounds
                ],
                "created_at": drive.created_at,
            }
        )
    return response

@router.post("/drives")
def create_drive(
    data: DriveCreate,
    recruiter: Recruiter = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):

    company = db.query(Company).filter(Company.id == data.company_id).first()
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found.")

    # 1️⃣ Create Drive
    drive = Drive(
        title=data.title,
        company_id=data.company_id,
        recruiter_id=recruiter.id,
        ctc=data.ctc,
        stipend=data.stipend,
        location=data.location,
        drive_type=data.drive_type,
        is_active=data.is_active,
        profile_details=data.profile_details,
    )

    db.add(drive)
    db.commit()
    db.refresh(drive)

    # 2️⃣ Add Eligibility
    eligibility = DriveEligibility(
        drive_id=drive.id,
        min_cgpa=data.eligibility.min_cgpa,
        allowed_branches=data.eligibility.allowed_branches,
        max_backlogs=data.eligibility.max_backlogs,
        batch_year=data.eligibility.batch_year
    )

    db.add(eligibility)

    # 3️⃣ Add Rounds
    for r in data.rounds:
        round_obj = DriveRound(
            drive_id=drive.id,
            name=r.name,
            order=r.order,
            is_elimination=r.is_elimination
        )
        db.add(round_obj)

    db.commit()

    return {"message": "Drive created successfully", "drive_id": drive.id}


@router.get("/my-drives")
def get_my_drives(
    recruiter: Recruiter = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    drives = (
        db.query(Drive, Company)
        .join(Company, Drive.company_id == Company.id)
        .filter(Drive.recruiter_id == recruiter.id)
        .order_by(Drive.created_at.desc())
        .all()
    )

    response = []
    for drive, company in drives:
        eligibility = (
            db.query(DriveEligibility)
            .filter(DriveEligibility.drive_id == drive.id)
            .first()
        )
        rounds = (
            db.query(DriveRound)
            .filter(DriveRound.drive_id == drive.id)
            .order_by(DriveRound.order)
            .all()
        )
        response.append(
            {
                "id": drive.id,
                "title": drive.title,
                "company_id": company.id,
                "company_name": company.name or company.industry,
                "industry": company.industry,
                "location": drive.location,
                "drive_type": drive.drive_type,
                "ctc": drive.ctc,
                "stipend": drive.stipend,
                "is_active": drive.is_active,
                "created_at": drive.created_at,
                "profile_details": drive.profile_details or {},
                "company_details": company.profile_details or {},
                "eligibility": (
                    {
                        "min_cgpa": eligibility.min_cgpa,
                        "allowed_branches": eligibility.allowed_branches,
                        "max_backlogs": eligibility.max_backlogs,
                        "batch_year": eligibility.batch_year,
                    }
                    if eligibility
                    else None
                ),
                "rounds": [
                    {
                        "name": interview_round.name,
                        "order": interview_round.order,
                        "is_elimination": interview_round.is_elimination,
                    }
                    for interview_round in rounds
                ],
            }
        )
    return response


@router.delete("/drives/{drive_id}")
def unpublish_my_drive(
    drive_id: int,
    recruiter: Recruiter = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    drive = (
        db.query(Drive)
        .filter(
            Drive.id == drive_id,
            Drive.recruiter_id == recruiter.id,
        )
        .first()
    )
    if drive is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Published job not found.",
        )
    if not drive.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This job has already been unpublished.",
        )

    drive.is_active = False
    company = db.query(Company).filter(Company.id == drive.company_id).first()
    if company:
        other_active_drives = (
            db.query(Drive.id)
            .filter(
                Drive.company_id == company.id,
                Drive.id != drive.id,
                Drive.is_active.is_(True),
            )
            .first()
        )
        if not other_active_drives:
            company.is_active = False

    db.commit()
    return {"message": "Job unpublished successfully.", "drive_id": drive.id}

@router.post("/apply")
def apply_to_drive(student_id: int, drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(Drive).filter(
        Drive.id == drive_id,
        Drive.is_active.is_(True),
    ).first()
    if drive is None:
        raise HTTPException(status_code=404, detail="This job is no longer available.")
    
    application = Application(
        student_id=student_id,
        drive_id=drive_id,
        status="applied",
        current_round=1
    )

    db.add(application)
    db.commit()

    return {"message": "Applied successfully"}
@router.post("/applications/{id}/next-round")
def move_to_next_round(id: int, db: Session = Depends(get_db)):
    
    app = db.query(Application).filter(Application.id == id).first()

    if not app:
        return {"error": "Application not found"}

    # get total rounds
    total_rounds = db.query(DriveRound).filter(
        DriveRound.drive_id == app.drive_id
    ).count()

    if app.current_round < total_rounds:
        app.current_round += 1
        app.status = "shortlisted"
    else:
        app.status = "selected"

    db.commit()

    return {
        "message": "Moved to next stage",
        "current_round": app.current_round,
        "status": app.status
    }
    
@router.post("/applications/{id}/reject")
def reject_candidate(id: int, db: Session = Depends(get_db)):
    
    app = db.query(Application).filter(Application.id == id).first()

    app.status = "rejected"
    db.commit()

    return {"message": "Candidate rejected"}