import hashlib
import html
import hmac
import json
import logging
import secrets
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.models.otp_challenge import OtpChallenge
from app.schemas.otp import OtpSendRequest, OtpVerifyRequest


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/otp", tags=["Email OTP"])

CHALLENGE_TTL = timedelta(minutes=5)
SESSION_TTL = timedelta(hours=12)
SEND_COOLDOWN = timedelta(seconds=60)
SEND_LIMIT_PER_HOUR = 5
MAX_VERIFY_ATTEMPTS = 5
COOKIE_NAME = "site_otp_session"


def _require_otp_settings():
    if not settings.BREVO_API_KEY or not settings.BREVO_FROM_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email verification is not configured. Set SMTP_KEY and SMTP_FROM_EMAIL on the backend.",
        )
    if not settings.OTP_SESSION_SECRET or len(settings.OTP_SESSION_SECRET) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email verification signing secret is not configured correctly.",
        )


def _email_hash(email: str) -> str:
    return hmac.new(
        settings.OTP_SESSION_SECRET.encode("utf-8"),
        email.strip().lower().encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _otp_hash(challenge_id: str, otp: str) -> str:
    return hmac.new(
        settings.OTP_SESSION_SECRET.encode("utf-8"),
        f"{challenge_id}:{otp}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _mask_email(email: str) -> str:
    local, domain = email.split("@", 1)
    visible_suffix = local[-1] if len(local) > 1 else ""
    return f"{local[0]}***{visible_suffix}@{domain}"


def _send_otp_email(email: str, otp: str) -> None:
    escaped_otp = html.escape(otp)
    payload = {
        "sender": {"email": settings.BREVO_FROM_EMAIL, "name": "Vitae"},
        "to": [{"email": email}],
        "subject": "Your Vitae verification code",
        "htmlContent": (
            "<div style=\"font-family:Arial,sans-serif;line-height:1.6\">"
            "<h2>Verify your email</h2>"
            f"<p>Your Vitae verification code is "
            f"<strong style=\"font-size:24px;letter-spacing:4px\">{escaped_otp}</strong>.</p>"
            "<p>This code expires in 5 minutes. If you did not request it, "
            "you can ignore this email.</p></div>"
        ),
        "textContent": f"Your Vitae verification code is {otp}. It expires in 5 minutes.",
    }
    request = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Accept": "application/json",
            "api-key": settings.BREVO_API_KEY,
            "Content-Type": "application/json",
            "User-Agent": "Vitae-OTP/1.0",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as result:
            response_data = json.loads(result.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        logger.warning("Brevo email request returned HTTP %s", error.code)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The email provider could not send the verification code. Check your Brevo API key and verified sender address.",
        ) from error
    except (urllib.error.URLError, TimeoutError, UnicodeDecodeError, json.JSONDecodeError) as error:
        logger.warning("Brevo email request failed: %s", type(error).__name__)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach the email provider. Please try again.",
        ) from error
    if not isinstance(response_data, dict) or not isinstance(response_data.get("messageId"), str):
        logger.warning("Brevo returned an unexpected email response.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The email provider returned an unexpected response.",
        )

def _verified_session_token() -> str:
    now = datetime.utcnow()
    return jwt.encode(
        {
            "purpose": "site_email_verification",
            "iat": now,
            "exp": now + SESSION_TTL,
        },
        settings.OTP_SESSION_SECRET,
        algorithm="HS256",
    )


@router.post("/send")
def send_otp(data: OtpSendRequest, db: Session = Depends(get_db)):
    _require_otp_settings()
    now = datetime.utcnow()
    email = str(data.email).strip().lower()
    email_hash = _email_hash(email)

    db.query(OtpChallenge).filter(
        OtpChallenge.created_at < now - timedelta(hours=24)
    ).delete(synchronize_session=False)

    recent_challenges = (
        db.query(OtpChallenge)
        .filter(
            OtpChallenge.email_hash == email_hash,
            OtpChallenge.created_at >= now - timedelta(hours=1),
        )
        .order_by(OtpChallenge.created_at.desc())
        .all()
    )
    if recent_challenges and now - recent_challenges[0].created_at < SEND_COOLDOWN:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait a minute before requesting another verification code.",
        )
    if len(recent_challenges) >= SEND_LIMIT_PER_HOUR:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Verification request limit reached. Try again in an hour.",
        )

    challenge_id = str(uuid.uuid4())
    otp = f"{secrets.randbelow(1_000_000):06d}"
    _send_otp_email(email, otp)
    db.add(
        OtpChallenge(
            id=challenge_id,
            email_hash=email_hash,
            otp_hash=_otp_hash(challenge_id, otp),
            created_at=now,
            expires_at=now + CHALLENGE_TTL,
            attempts=0,
        )
    )
    db.commit()
    return {
        "challenge_id": challenge_id,
        "email": _mask_email(email),
        "expires_in": int(CHALLENGE_TTL.total_seconds()),
        "resend_after": int(SEND_COOLDOWN.total_seconds()),
    }


@router.post("/verify")
def verify_otp(
    data: OtpVerifyRequest,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    _require_otp_settings()
    challenge = (
        db.query(OtpChallenge)
        .filter(OtpChallenge.id == data.challenge_id)
        .with_for_update()
        .first()
    )
    now = datetime.utcnow()
    if challenge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OTP request not found.")
    if challenge.verified_at is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This OTP has already been used.")
    if challenge.expires_at <= now:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="OTP expired. Request a new code.")
    if challenge.attempts >= MAX_VERIFY_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many incorrect codes. Request a new verification code.",
        )

    challenge.attempts += 1
    db.commit()

    if not hmac.compare_digest(challenge.otp_hash, _otp_hash(challenge.id, data.otp)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The OTP is incorrect. Check the code and try again.",
        )

    challenge.verified_at = datetime.utcnow()
    db.commit()
    response.set_cookie(
        key=COOKIE_NAME,
        value=_verified_session_token(),
        max_age=int(SESSION_TTL.total_seconds()),
        httponly=True,
        secure=settings.OTP_COOKIE_SECURE or request.url.scheme == "https",
        samesite="lax",
        path="/",
    )
    return {"verified": True}


@router.get("/status")
def otp_status(request: Request):
    session_token = request.cookies.get(COOKIE_NAME)
    if not session_token or not settings.OTP_SESSION_SECRET:
        return {"verified": False}
    try:
        claims = jwt.decode(
            session_token,
            settings.OTP_SESSION_SECRET,
            algorithms=["HS256"],
        )
    except JWTError:
        return {"verified": False}
    return {"verified": claims.get("purpose") == "site_email_verification"}


@router.post("/logout")
def logout_otp(response: Response):
    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        secure=settings.OTP_COOKIE_SECURE,
        samesite="lax",
        path="/",
    )
    return {"verified": False}
