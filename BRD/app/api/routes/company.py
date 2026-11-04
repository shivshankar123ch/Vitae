from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.company import Company,CompanyRegistrationRequest, CompanyStatusLog
from app.schemas.company import CompanyCreate, StatusUpdate,CompanyRequestCreate
from app.api.deps import get_db
# from main import app

router = APIRouter(prefix="/ Company & Recruiter Management", tags=["Companies"])

# Create Company

@router.post("/")
def create_company(data: CompanyCreate, db: Session = Depends(get_db)):
    company = Company(**data.dict())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company

@router.get("/")
def get_companies(db: Session = Depends(get_db)):
    return db.query(Company).filter(Company.is_active.is_(True)).all()

# Blacklist / Whitelist

@router.post("/{company_id}/status")
def update_status(company_id: int, data: StatusUpdate, db: Session = Depends(get_db)):
    company = db.query(Company).get(company_id)

    if data.status == "blacklist":
        company.is_blacklisted = True
    elif data.status == "whitelist":
        company.is_whitelisted = True

    log = CompanyStatusLog(
        company_id=company_id,
        status=data.status,
        reason=data.reason,
        approved_by=data.approved_by
    )

    db.add(log)
    db.commit()

    return {"message": "Status updated"}

# Company Self Registration
@router.post("/company-request")
def request_company(data: CompanyRequestCreate, db: Session = Depends(get_db)):
    req = CompanyRegistrationRequest(**data.dict())
    db.add(req)
    db.commit()
    return {"message": "Request submitted for approval"}

# Approve Company (TPO)
@router.post("/company-request/{id}/approve")
def approve_company(id: int, db: Session = Depends(get_db)):
    req = db.query(CompanyRegistrationRequest).get(id)

    company = Company(
        name=req.company_name,
        industry=req.industry,
        tier=req.tier
    )

    req.status = "approved"

    db.add(company)
    db.commit()

    return {"message": "Company approved & created"}
