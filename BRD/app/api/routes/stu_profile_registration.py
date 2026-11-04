from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from app.schemas import stu_profile_registration as schemas
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app import models
from app.models.stu_profile_registration import User
from app.models.student import Student
from app.api.deps import get_db
from app.core import security

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app import models
from app.api import security
from app.api.deps import get_db

from app.schemas.stu_profile_registration import (
    UserIn,
    UserOut,
    Token,
)

# =========================================================
# ROUTER
# =========================================================

router = APIRouter()

# =========================================================
# 🔐 REGISTER
# =========================================================

@router.post(
    "/register/",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_in: UserIn,
    db: Session = Depends(get_db),
):

    # ✅ CHECK USERNAME
    existing_user = db.query(User).filter(
        User.username == user_in.username
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    # ✅ CHECK EMAIL
    existing_email = db.query(User).filter(
        User.email == user_in.email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # ✅ HASH PASSWORD
    hashed_password = security.get_password_hash(
        user_in.password
    )

    # ✅ CREATE USER
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
    )

    try:
        db.add(db_user)
        if db.query(Student).filter(Student.email == user_in.email).first() is None:
            db.add(Student(name=user_in.username, email=user_in.email))

        db.commit()

        db.refresh(db_user)

        return db_user

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}",
        )
# =========================================================
# 🔑 LOGIN
# =========================================================

@router.post(
    "/token",
    response_model=Token
)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):

    # ✅ GET USER
    user = db.query(User).filter(
        User.username == form_data.username
    ).first()

    # ✅ INVALID USER
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    # ✅ VERIFY PASSWORD
    valid_password = security.verify_password(
        form_data.password,
        user.hashed_password,
    )

    if not valid_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    # ✅ CREATE ACCESS TOKEN
    access_token = security.create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(
            minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }