from pydantic import (
    BaseModel,
    EmailStr,
    ConfigDict,
    field_validator,
)

from typing import Optional


# =========================================================
# 🔐 USER BASE
# =========================================================

class UserBase(BaseModel):
    username: str
    email: EmailStr


# =========================================================
# 🆕 USER REGISTER INPUT
# =========================================================

class UserIn(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("Password must not exceed 72 UTF-8 bytes.")
        return password


# =========================================================
# 📤 USER RESPONSE
# =========================================================

# class UserInDBBase(UserBase):
#     id: int

#     model_config = ConfigDict(
#         from_attributes=True
#     )
class UserOut(UserBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True
    )



# =========================================================
# 🔒 USER DB MODEL
# =========================================================

# class UserInDB(UserInDBBase):
#     password: str


# =========================================================
# 🎫 TOKEN DATA
# =========================================================

class TokenData(BaseModel):
    username: Optional[str] = None


# =========================================================
# 🔑 ACCESS TOKEN RESPONSE
# =========================================================

class Token(BaseModel):
    access_token: str
    token_type: str