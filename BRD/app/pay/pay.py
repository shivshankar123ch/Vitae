import hmac
import uuid
from hashlib import sha256

import razorpay
from fastapi import HTTPException, status

from app.core.config import settings


def get_razorpay_client():
    key_id = settings.RAZORPAY_KEY_ID
    key_secret = settings.RAZORPAY_KEY_SECRET
    if not key_id or not key_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Online payments are not configured. Set the Razorpay keys "
                "in the backend .env file."
            ),
        )
    return razorpay.Client(auth=(key_id, key_secret)), key_id, key_secret


def create_razorpay_order(
    client,
    amount_paise: int,
    recruiter_id: int,
    plan_name: str,
    billing_cycle: str,
):
    return client.order.create(
        {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"rp_{uuid.uuid4().hex[:32]}",
            "notes": {
                "recruiter_id": str(recruiter_id),
                "plan_name": plan_name,
                "billing_cycle": billing_cycle,
            },
        }
    )


def verify_razorpay_signature(
    order_id: str,
    payment_id: str,
    signature: str,
    key_secret: str,
) -> bool:
    expected_signature = hmac.new(
        key_secret.encode("utf-8"),
        f"{order_id}|{payment_id}".encode("utf-8"),
        sha256,
    ).hexdigest()
    return hmac.compare_digest(expected_signature, signature)
