import hmac
import logging
from datetime import datetime, timedelta
from typing import Optional

from razorpay.errors import BadRequestError
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api import security
from app.api.deps import get_db
from app.core.config import settings
from app.models.recruiter import User
from app.models.recruiter_plan_payment import RecruiterPlanPayment
from app.models.recruiter_plan import RecruiterPlan
from app.models.student import Student
from app.pay.pay import (
    create_razorpay_order,
    get_razorpay_client,
    verify_razorpay_signature,
)

router = APIRouter()
logger = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/recruiter/token")
admin_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/recruiter/admin/token")
PLAN_FEATURE_KEYS = (
    "zero_shot_ai_matching",
    "multi_channel_sourcing",
    "full_resume_preview",
    "priority_job_visibility",
)
PLAN_COMPARISON_SECTIONS = (
    {
        "title": "USAGE & CREDITS",
        "rows": (
            {"label": "Job Postings", "key": "job_postings"},
            {"label": "Salary Limit", "key": "salary_limit"},
            {"label": "Monthly Unlock Credits", "key": "monthly_unlock_credits"},
            {"label": "Monthly Subscription", "key": "monthly_subscription"},
            {"label": "Annual Unlock Credits", "key": "annual_unlock_credits"},
            {"label": "Annual Subscription", "key": "annual_subscription"},
            {"label": "Recruiter Seats", "key": "recruiter_seats"},
        ),
    },
    {
        "title": "AI & SOURCING",
        "rows": (
            {"label": "Zero-Shot AI Matching", "feature": "zero_shot_ai_matching"},
            {"label": "Multi-Channel Sourcing", "feature": "multi_channel_sourcing"},
            {"label": "Full Resume Preview", "feature": "full_resume_preview"},
            {"label": "Priority Job Visibility", "feature": "priority_job_visibility"},
        ),
    },
)
DEFAULT_PLAN_CATALOG = (
    {
        "name": "Pay as You Go",
        "subtitle": "30-day student access",
        "sort_order": 0,
        "monthly_unlock_credits": "Unlimited (30-day access)",
        "monthly_price_rupees": 100,
        "monthly_billing_label": "30 days",
        "annual_unlock_credits": "Not available",
        "annual_price_rupees": None,
        "recruiter_seats": 1,
    },
    {
        "name": "Seed",
        "subtitle": "Hire ~5 / Month",
        "sort_order": 1,
        "monthly_unlock_credits": "50",
        "monthly_price_rupees": 2000,
        "monthly_billing_label": "mo",
        "annual_unlock_credits": "600",
        "annual_price_rupees": 9600,
        "recruiter_seats": 5,
    },
    {
        "name": "Startup",
        "subtitle": "Hire ~10 / Month",
        "sort_order": 2,
        "monthly_unlock_credits": "150",
        "monthly_price_rupees": 4000,
        "monthly_billing_label": "mo",
        "annual_unlock_credits": "1,800",
        "annual_price_rupees": 19200,
        "recruiter_seats": 10,
        "featured": True,
    },
    {
        "name": "Scaleup",
        "subtitle": "Hire ~50 / Month",
        "sort_order": 3,
        "monthly_unlock_credits": "500",
        "monthly_price_rupees": 10000,
        "monthly_billing_label": "mo",
        "annual_unlock_credits": "6,000",
        "annual_price_rupees": 48000,
        "recruiter_seats": 50,
    },
    {
        "name": "Enterprise",
        "subtitle": "Hire ~200 / Month",
        "sort_order": 4,
        "monthly_unlock_credits": "2,000",
        "monthly_price_rupees": 40000,
        "monthly_billing_label": "mo",
        "annual_unlock_credits": "24,000",
        "annual_price_rupees": 192000,
        "recruiter_seats": 200,
    },
)


class CreatePlanOrder(BaseModel):
    plan_name: str = Field(min_length=1, max_length=40)
    billing_cycle: str


class VerifyPlanPayment(BaseModel):
    razorpay_order_id: str = Field(min_length=1, max_length=80)
    razorpay_payment_id: str = Field(min_length=1, max_length=80)
    razorpay_signature: str = Field(min_length=1, max_length=256)


class PlanCatalogItem(BaseModel):
    name: str = Field(min_length=1, max_length=40)
    subtitle: str = Field(max_length=120)
    sort_order: int = Field(ge=0)
    is_active: bool = True
    featured: bool = False
    job_postings: str = Field(min_length=1, max_length=80)
    salary_limit: str = Field(min_length=1, max_length=80)
    monthly_unlock_credits: str = Field(min_length=1, max_length=80)
    monthly_price_rupees: int = Field(ge=1)
    monthly_billing_label: str = Field(min_length=1, max_length=20)
    annual_unlock_credits: str = Field(min_length=1, max_length=80)
    annual_price_rupees: Optional[int] = Field(default=None, ge=1)
    recruiter_seats: int = Field(ge=0)
    features: dict[str, bool] = Field(default_factory=dict)


class PlanCatalogUpdate(BaseModel):
    plans: list[PlanCatalogItem] = Field(min_length=1, max_length=20)


def get_current_recruiter(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = security.decode_access_token(token)
    if not payload or payload.get("role") != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A recruiter account is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    recruiter = db.query(User).filter(User.username == payload.get("sub")).first()
    if recruiter is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Recruiter account was not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return recruiter


def get_current_plan_admin(
    token: str = Depends(admin_oauth2_scheme),
) -> str:
    admin_username = settings.PLAN_ADMIN_USERNAME
    jwt_secret = settings.PLAN_ADMIN_JWT_SECRET
    if (
        not admin_username
        or not settings.PLAN_ADMIN_PASSWORD
        or not jwt_secret
        or len(jwt_secret) < 32
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Plan admin credentials and a 32-character signing key are required.",
        )
    try:
        payload = (
            jwt.decode(token, jwt_secret, algorithms=[security.ALGORITHM])
        )
    except JWTError:
        payload = None
    if (
        not payload
        or payload.get("role") != "plan_admin"
        or payload.get("sub") != admin_username
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A plan administrator account is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return admin_username


def seed_default_plan_catalog(db: Session) -> None:
    if db.query(RecruiterPlan.name).first():
        return

    common_values = {
        "is_active": True,
        "job_postings": "Unlimited",
        "salary_limit": "No Limit",
        "features": {key: True for key in PLAN_FEATURE_KEYS},
    }
    db.add_all(
        [
            RecruiterPlan(**common_values, **plan)
            for plan in DEFAULT_PLAN_CATALOG
        ]
    )
    try:
        db.commit()
    except Exception:
        db.rollback()
        if not db.query(RecruiterPlan.name).first():
            raise


def format_inr(amount: int) -> str:
    digits = str(amount)
    if len(digits) <= 3:
        return digits
    last_three = digits[-3:]
    prefix = digits[:-3]
    groups = []
    while prefix:
        groups.insert(0, prefix[-2:])
        prefix = prefix[:-2]
    return f"{','.join(groups)},{last_three}"


def serialize_plan(plan: RecruiterPlan) -> dict:
    return {
        "name": plan.name,
        "subtitle": plan.subtitle,
        "sort_order": plan.sort_order,
        "is_active": plan.is_active,
        "featured": plan.featured,
        "job_postings": plan.job_postings,
        "salary_limit": plan.salary_limit,
        "monthly_unlock_credits": plan.monthly_unlock_credits,
        "monthly_price_rupees": plan.monthly_price_rupees,
        "monthly_billing_label": plan.monthly_billing_label,
        "monthly_subscription": (
            f"₹{format_inr(plan.monthly_price_rupees)} / {plan.monthly_billing_label}"
        ),
        "annual_unlock_credits": plan.annual_unlock_credits,
        "annual_price_rupees": plan.annual_price_rupees,
        "annual_subscription": (
            f"₹{format_inr(plan.annual_price_rupees)} / yr"
            if plan.annual_price_rupees is not None
            else "Not available"
        ),
        "recruiter_seats": plan.recruiter_seats,
        "features": {
            key: bool((plan.features or {}).get(key, False))
            for key in PLAN_FEATURE_KEYS
        },
    }


def serialize_plan_catalog(plans: list[RecruiterPlan]) -> dict:
    return {
        "feature_column_label": "Features",
        "sections": [
            {"title": section["title"], "rows": list(section["rows"])}
            for section in PLAN_COMPARISON_SECTIONS
        ],
        "plans": [serialize_plan(plan) for plan in plans],
    }


@router.post("/admin/token")
def login_plan_admin(form_data: OAuth2PasswordRequestForm = Depends()):
    admin_username = settings.PLAN_ADMIN_USERNAME
    admin_password = settings.PLAN_ADMIN_PASSWORD
    jwt_secret = settings.PLAN_ADMIN_JWT_SECRET
    if (
        not admin_username
        or not admin_password
        or not jwt_secret
        or len(jwt_secret) < 32
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Plan admin credentials and a 32-character signing key are required.",
        )
    if not (
        hmac.compare_digest(form_data.username, admin_username)
        and hmac.compare_digest(form_data.password, admin_password)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect admin username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "access_token": jwt.encode(
            {
                "sub": admin_username,
                "role": "plan_admin",
                "exp": datetime.utcnow()
                + timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES),
            },
            jwt_secret,
            algorithm=security.ALGORITHM,
        ),
        "token_type": "bearer",
    }


@router.get("/billing/plans")
def get_public_plans(response: Response, db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    seed_default_plan_catalog(db)
    plans = (
        db.query(RecruiterPlan)
        .filter(RecruiterPlan.is_active.is_(True))
        .order_by(RecruiterPlan.sort_order, RecruiterPlan.name)
        .all()
    )
    return serialize_plan_catalog(plans)


@router.get("/admin/plans")
def get_plan_catalog(
    _: str = Depends(get_current_plan_admin),
    db: Session = Depends(get_db),
):
    seed_default_plan_catalog(db)
    plans = (
        db.query(RecruiterPlan)
        .order_by(RecruiterPlan.sort_order, RecruiterPlan.name)
        .all()
    )
    return serialize_plan_catalog(plans)


@router.put("/admin/plans")
def replace_plan_catalog(
    request: PlanCatalogUpdate,
    _: str = Depends(get_current_plan_admin),
    db: Session = Depends(get_db),
):
    names = [plan.name for plan in request.plans]
    if len(names) != len(set(names)):
        raise HTTPException(status_code=422, detail="Plan names must be unique.")
    if not any(plan.is_active for plan in request.plans):
        raise HTTPException(
            status_code=422,
            detail="At least one plan must remain active.",
        )

    existing_plans = {
        plan.name: plan for plan in db.query(RecruiterPlan).all()
    }
    updated_names = set(names)
    for item in request.plans:
        values = item.model_dump()
        values["features"] = {
            key: item.features.get(key, False)
            for key in PLAN_FEATURE_KEYS
        }
        plan = existing_plans.get(item.name)
        if plan is None:
            db.add(RecruiterPlan(**values))
        else:
            for key, value in values.items():
                setattr(plan, key, value)

    for removed_name in set(existing_plans) - updated_names:
        db.delete(existing_plans[removed_name])

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.exception("Could not update recruiter plan catalog")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save the plan catalog.",
        ) from exc

    plans = (
        db.query(RecruiterPlan)
        .order_by(RecruiterPlan.sort_order, RecruiterPlan.name)
        .all()
    )
    return serialize_plan_catalog(plans)


def current_active_payment(db: Session, recruiter_id: int):
    now = datetime.utcnow()
    return (
        db.query(RecruiterPlanPayment)
        .filter(
            RecruiterPlanPayment.recruiter_id == recruiter_id,
            RecruiterPlanPayment.status == "paid",
            RecruiterPlanPayment.expires_at > now,
        )
        .order_by(RecruiterPlanPayment.expires_at.desc())
        .first()
    )


@router.get("/billing/access")
def get_billing_access(
    recruiter: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    active_payment = current_active_payment(db, recruiter.id)
    if active_payment is None:
        return {"active": False}

    return {
        "active": True,
        "plan_name": active_payment.plan_name,
        "billing_cycle": active_payment.billing_cycle,
        "expires_at": active_payment.expires_at,
        "email": recruiter.email,
        "recruiter_name": recruiter.username,
    }


@router.get("/applied-students")
def get_applied_students(
    recruiter: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    active_payment = current_active_payment(db, recruiter.id)
    if active_payment is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Choose and pay for a recruiter plan to view student profiles.",
        )

    students = db.query(Student).order_by(Student.id.desc()).all()
    return [
        {
            "id": student.id,
            "student_name": student.name,
            "email": student.email,
            "phone": student.phone,
            "branch": student.branch,
            "cgpa": student.cgpa,
            "skills": student.skill_name,
            "title": student.title,
            "description": student.description,
            "tech_stack": student.tech_stack,
            "batch_year": student.batch_year,
            "resume_available": student.resume_data is not None,
            "resume_filename": student.resume_filename,
            "profile_details": student.profile_details or {},
            "experiences": [
                {
                    "company": experience.company,
                    "role": experience.role,
                    "experience": experience.experience,
                    "start_date": experience.start_date.isoformat() if experience.start_date else "",
                    "end_date": experience.end_date.isoformat() if experience.end_date else "",
                }
                for experience in student.experiences
            ],
        }
        for student in students
    ]


@router.post("/billing/order", status_code=status.HTTP_201_CREATED)
def create_plan_order(
    request: CreatePlanOrder,
    recruiter: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    plan = (
        db.query(RecruiterPlan)
        .filter(
            RecruiterPlan.name == request.plan_name,
            RecruiterPlan.is_active.is_(True),
        )
        .first()
    )
    if plan is None:
        raise HTTPException(status_code=400, detail="Select a valid recruiter plan.")
    if request.billing_cycle not in {"monthly", "annual"}:
        raise HTTPException(status_code=400, detail="Select a valid billing cycle.")

    if request.billing_cycle == "annual":
        if plan.annual_price_rupees is None:
            raise HTTPException(
                status_code=400,
                detail="Annual billing is not available for this plan.",
            )
        amount_rupees = plan.annual_price_rupees
    else:
        amount_rupees = plan.monthly_price_rupees
    amount_paise = amount_rupees * 100

    client, key_id, _ = get_razorpay_client()
    try:
        order = create_razorpay_order(
            client,
            amount_paise,
            recruiter.id,
            request.plan_name,
            request.billing_cycle,
        )
    except BadRequestError as exc:
        if "authentication failed" in str(exc).casefold():
            logger.error(
                "Razorpay rejected API credentials while creating an order for recruiter %s",
                recruiter.id,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=(
                    "Razorpay rejected the API credentials. Set a matching API "
                    "Key ID and Key Secret from the same Razorpay account and "
                    "mode (test or live), then restart the backend."
                ),
            ) from exc
        logger.exception("Razorpay rejected the order request for recruiter %s", recruiter.id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Razorpay rejected the payment order. Check the plan and try again.",
        ) from exc
    except Exception as exc:
        logger.exception("Razorpay order creation failed for recruiter %s", recruiter.id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not create a payment order. Please try again.",
        ) from exc

    if order.get("amount") != amount_paise or order.get("currency") != "INR":
        logger.error("Razorpay returned an unexpected amount or currency for order")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The payment provider returned an invalid order.",
        )

    pending_payment = RecruiterPlanPayment(
        recruiter_id=recruiter.id,
        plan_name=request.plan_name,
        billing_cycle=request.billing_cycle,
        amount_paise=amount_paise,
        razorpay_order_id=order["id"],
        status="created",
    )
    try:
        db.add(pending_payment)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.exception("Could not persist Razorpay order for recruiter %s", recruiter.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save the payment order. Please try again.",
        ) from exc

    return {
        "key_id": key_id,
        "order_id": order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "plan_name": request.plan_name,
        "billing_cycle": request.billing_cycle,
        "email": recruiter.email,
        "recruiter_name": recruiter.username,
    }


@router.post("/billing/verify")
def verify_plan_payment(
    request: VerifyPlanPayment,
    recruiter: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    payment_order = (
        db.query(RecruiterPlanPayment)
        .filter(
            RecruiterPlanPayment.razorpay_order_id == request.razorpay_order_id,
            RecruiterPlanPayment.recruiter_id == recruiter.id,
        )
        .first()
    )
    if payment_order is None:
        raise HTTPException(status_code=404, detail="Payment order was not found.")

    if (
        payment_order.status == "paid"
        and payment_order.razorpay_payment_id == request.razorpay_payment_id
    ):
        return {
            "active": True,
            "plan_name": payment_order.plan_name,
            "billing_cycle": payment_order.billing_cycle,
            "expires_at": payment_order.expires_at,
        }
    if payment_order.status != "created":
        raise HTTPException(status_code=409, detail="This payment order has already been processed.")

    client, _, key_secret = get_razorpay_client()
    if not verify_razorpay_signature(
        request.razorpay_order_id,
        request.razorpay_payment_id,
        request.razorpay_signature,
        key_secret,
    ):
        raise HTTPException(status_code=400, detail="Payment signature verification failed.")

    try:
        captured_payment = client.payment.fetch(request.razorpay_payment_id)
    except Exception as exc:
        logger.exception("Razorpay payment lookup failed for order %s", request.razorpay_order_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not confirm the payment with Razorpay.",
        ) from exc

    if (
        captured_payment.get("order_id") != payment_order.razorpay_order_id
        or captured_payment.get("amount") != payment_order.amount_paise
        or captured_payment.get("currency") != "INR"
        or captured_payment.get("status") != "captured"
    ):
        raise HTTPException(
            status_code=400,
            detail="Razorpay has not confirmed a captured payment for this plan.",
        )

    existing_payment = (
        db.query(RecruiterPlanPayment)
        .filter(
            RecruiterPlanPayment.razorpay_payment_id == request.razorpay_payment_id
        )
        .first()
    )
    if existing_payment is not None:
        raise HTTPException(status_code=409, detail="This payment has already been applied.")

    now = datetime.utcnow()
    active_payment = current_active_payment(db, recruiter.id)
    access_starts = max(now, active_payment.expires_at) if active_payment else now
    access_days = 365 if payment_order.billing_cycle == "annual" else 30
    payment_order.razorpay_payment_id = request.razorpay_payment_id
    payment_order.status = "paid"
    payment_order.paid_at = now
    payment_order.expires_at = access_starts + timedelta(days=access_days)

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.exception("Could not activate plan for recruiter %s", recruiter.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment was verified, but the plan could not be activated. Contact support.",
        ) from exc

    return {
        "active": True,
        "plan_name": payment_order.plan_name,
        "billing_cycle": payment_order.billing_cycle,
        "expires_at": payment_order.expires_at,
    }
