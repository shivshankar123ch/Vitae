from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from sqlalchemy import Column, ForeignKey, Integer, LargeBinary, inspect, text
from sqlalchemy.orm import Session
from sqlalchemy.schema import CreateColumn
from sqlalchemy.types import JSON, String
import mimetypes
from pathlib import Path

from app.api.api_router import router
from app.api.deps import get_db
from app.api.routes.recruiter_billing import current_active_payment, get_current_recruiter
from app.core.database import Base, engine
from app.core.config import settings
from app.models.recruiter import User as Recruiter
from app.models.student import Student
from app.models.otp_challenge import OtpChallenge


# =========================================================
# CREATE TABLES
# =========================================================

Base.metadata.create_all(bind=engine)


def ensure_profile_details_columns():
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())
    column_specs = {
        "students": {
            "profile_details": JSON,
            "resume_data": LargeBinary,
            "resume_filename": String(255),
            "resume_content_type": String(120),
        },
        "companies": {"name": String(255), "profile_details": JSON},
        "drives": {
            "profile_details": JSON,
            "recruiter_id": Integer,
        },
    }
    missing_columns = []
    for table_name, columns in column_specs.items():
        if table_name not in table_names:
            continue
        existing_columns = {
            column["name"] for column in inspector.get_columns(table_name)
        }
        for column_name, column_type in columns.items():
            if column_name not in existing_columns:
                missing_columns.append((table_name, column_name, column_type))

    if missing_columns:
        with engine.begin() as connection:
            for table_name, column_name, column_type in missing_columns:
                column_args = (column_type,)
                if column_name == "recruiter_id":
                    column_args += (ForeignKey("recruiter.id"),)
                column = Column(
                    column_name,
                    *column_args,
                    nullable=True,
                )
                column_definition = CreateColumn(column).compile(dialect=engine.dialect)
                connection.execute(
                    text(f"ALTER TABLE {table_name} ADD COLUMN {column_definition}")
                )

    if {"students", "users"}.issubset(table_names):
        with engine.begin() as connection:
            connection.execute(
                text(
                    "INSERT INTO students (name, email) "
                    "SELECT users.username, users.email FROM users "
                    "WHERE NOT EXISTS ("
                    "SELECT 1 FROM students "
                    "WHERE LOWER(students.email) = LOWER(users.email)"
                    ")"
                )
            )

    if "students" in table_names:
        resume_directory = Path(__file__).resolve().parent / "uploads" / "resumes"
        with engine.begin() as connection:
            students = connection.execute(
                text(
                    "SELECT id, resume FROM students "
                    "WHERE resume IS NOT NULL AND resume_data IS NULL"
                )
            ).mappings()
            for student in students:
                resume_path = Path(str(student["resume"]).replace("\\", "/"))
                if (
                    resume_path.parts[:2] != ("uploads", "resumes")
                    or len(resume_path.parts) != 3
                ):
                    continue
                stored_file = resume_directory / resume_path.name
                if not stored_file.is_file():
                    continue
                resume_data = stored_file.read_bytes()
                content_type = (
                    mimetypes.guess_type(resume_path.name)[0]
                    or "application/octet-stream"
                )
                connection.execute(
                    text(
                        "UPDATE students SET resume_data = :resume_data, "
                        "resume_filename = :resume_filename, "
                        "resume_content_type = :content_type WHERE id = :student_id"
                    ),
                    {
                        "resume_data": resume_data,
                        "resume_filename": resume_path.name,
                        "content_type": content_type,
                        "student_id": student["id"],
                    },
                )

ensure_profile_details_columns()


# =========================================================
# INITIALIZE APP
# =========================================================

app = FastAPI(title="Placement ERP")
uploads_directory = Path(__file__).resolve().parent / "uploads"
uploads_directory.mkdir(parents=True, exist_ok=True)
(uploads_directory / "founder").mkdir(parents=True, exist_ok=True)


@app.get("/uploads/resumes/{filename}", include_in_schema=False)
def get_protected_resume_file(
    filename: str,
    recruiter: Recruiter = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    if Path(filename).name != filename:
        raise HTTPException(status_code=404, detail="Resume not found.")
    if current_active_payment(db, recruiter.id) is None:
        raise HTTPException(
            status_code=403,
            detail="Choose and pay for a recruiter plan to view student profiles.",
        )

    student = (
        db.query(Student)
        .filter(Student.resume == f"uploads/resumes/{filename}")
        .first()
    )
    if student is None or student.resume_data is None:
        raise HTTPException(status_code=404, detail="Resume not found.")

    return Response(
        content=student.resume_data,
        media_type=student.resume_content_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


app.mount("/uploads", StaticFiles(directory=uploads_directory), name="uploads")


# =========================================================
# CORS CONFIGURATION
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# INCLUDE ROUTES
# =========================================================

app.include_router(router)


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
def read_root():
    return {"message": "Hello World"}
