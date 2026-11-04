from fastapi import APIRouter

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.post("/send-email")
def send_email(to: str, message: str):
    # integrate real email service later
    return {"message": f"Email sent to {to}"}

@router.post("/send-sms")
def send_sms(phone: str, message: str):
    return {"message": f"SMS sent to {phone}"}