from pydantic import BaseModel, EmailStr, Field


class OtpSendRequest(BaseModel):
    email: EmailStr


class OtpVerifyRequest(BaseModel):
    challenge_id: str = Field(..., min_length=36, max_length=36)
    otp: str = Field(..., pattern=r"^[0-9]{6}$")
