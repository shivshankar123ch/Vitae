import logging
import uuid
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload

from app.api import security
from app.api.deps import get_db
from app.models.recruiter import User
from app.models.recruiter_feedback import RecruiterFeedback
from app.schemas.recruiter_feedback import RecruiterFeedbackOut

router = APIRouter()
logger = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/recruiter/token")
feedback_upload_dir = Path(__file__).resolve().parents[3] / "uploads" / "recruiter-feedback"
max_photo_bytes = 5 * 1024 * 1024
image_signatures = (
    (b"\xff\xd8\xff", ".jpg"),
    (b"\x89PNG\r\n\x1a\n", ".png"),
    (b"GIF87a", ".gif"),
    (b"GIF89a", ".gif"),
)


def get_current_recruiter(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = security.decode_access_token(token)
    if not payload or payload.get("role") != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A recruiter account is required to post feedback.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username = payload.get("sub")
    recruiter = db.query(User).filter(User.username == username).first()
    if recruiter is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Recruiter account was not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return recruiter


def feedback_response(feedback: RecruiterFeedback) -> dict:
    return {
        "id": feedback.id,
        "recruiter_name": feedback.recruiter.username,
        "comment": feedback.comment,
        "image_url": (
            f"/uploads/recruiter-feedback/{feedback.image_path}"
            if feedback.image_path
            else None
        ),
        "created_at": feedback.created_at,
    }


@router.get("/feedback", response_model=list[RecruiterFeedbackOut])
def list_feedback(db: Session = Depends(get_db)):
    feedback = (
        db.query(RecruiterFeedback)
        .options(joinedload(RecruiterFeedback.recruiter))
        .join(User)
        .order_by(RecruiterFeedback.created_at.desc(), RecruiterFeedback.id.desc())
        .all()
    )
    return [feedback_response(item) for item in feedback]


@router.post(
    "/feedback",
    response_model=RecruiterFeedbackOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_feedback(
    comment: str = Form(..., min_length=1, max_length=1000),
    photo: UploadFile = File(...),
    recruiter: User = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    comment = comment.strip()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Feedback comment cannot be empty.",
        )

    content = await photo.read(max_photo_bytes + 1)
    if len(content) > max_photo_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Photo must be 5 MB or smaller.",
        )

    extension = next(
        (
            candidate_extension
            for signature, candidate_extension in image_signatures
            if content.startswith(signature)
        ),
        None,
    )
    is_webp = (
        len(content) >= 12
        and content[:4] == b"RIFF"
        and content[8:12] == b"WEBP"
    )
    if extension is None and is_webp:
        extension = ".webp"
    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload a valid JPEG, PNG, GIF, or WebP image.",
        )

    image_path = f"{uuid.uuid4().hex}{extension}"
    feedback_upload_dir.mkdir(parents=True, exist_ok=True)
    saved_photo = feedback_upload_dir / image_path
    saved_photo.write_bytes(content)

    feedback = RecruiterFeedback(
        recruiter_id=recruiter.id,
        comment=comment,
        image_path=image_path,
    )
    try:
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        return feedback_response(feedback)
    except Exception as exc:
        db.rollback()
        if saved_photo is not None:
            saved_photo.unlink(missing_ok=True)
        logger.exception("Failed to save recruiter feedback")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save recruiter feedback.",
        ) from exc
