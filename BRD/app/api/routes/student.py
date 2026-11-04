from fastapi import APIRouter, Depends, Form, UploadFile, File, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.student import Student, Experience
from app.models.stu_profile_registration import User as StudentUser
from app.api.auth import get_current_user
from app.models.recruiter import User as Recruiter
from app.api.routes.recruiter_billing import (
    current_active_payment,
    get_current_recruiter,
)

import json
import logging
import mimetypes
import uuid
from datetime import date, datetime
from pathlib import Path
from urllib.parse import quote

router = APIRouter()
logger = logging.getLogger(__name__)


def serialize_student(student: Student):
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "phone": student.phone,
        "branch": student.branch,
        "cgpa": student.cgpa,
        "backlogs": student.backlogs,
        "batch_year": student.batch_year,
        "skill_name": student.skill_name,
        "title": student.title,
        "description": student.description,
        "tech_stack": student.tech_stack,
        "resume": student.resume,
        "resume_filename": student.resume_filename,
        "profile_details": student.profile_details or {},
        "experiences": [
            {
                "id": experience.id,
                "company": experience.company,
                "role": experience.role,
                "experience": experience.experience,
                "start_date": experience.start_date.isoformat() if experience.start_date else "",
                "end_date": experience.end_date.isoformat() if experience.end_date else "",
            }
            for experience in student.experiences
        ],
    }


@router.get("/profile/me")
def get_my_student_profile(
    current_user: StudentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.email == current_user.email).first()
    if student:
        return serialize_student(student)

    return {
        "name": current_user.username,
        "email": current_user.email,
        "phone": "",
        "branch": "",
        "cgpa": None,
        "backlogs": None,
        "batch_year": None,
        "skill_name": "",
        "title": "",
        "description": "",
        "tech_stack": "",
        "resume": None,
        "resume_filename": None,
        "profile_details": {},
        "experiences": [],
    }


@router.get("/profile/me/resume")
def get_my_student_resume(
    current_user: StudentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.email == current_user.email).first()
    if student is None or student.resume_data is None:
        raise HTTPException(status_code=404, detail="No resume has been uploaded.")

    filename = quote(Path(student.resume_filename or "resume").name, safe="")
    return Response(
        content=student.resume_data,
        media_type=student.resume_content_type or "application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )


@router.put("/profile/me")
async def save_my_student_profile(
    name: str = Form(""),
    phone: str = Form(""),
    branch: str = Form(""),
    cgpa: str = Form(""),
    backlogs: str = Form(""),
    batch_year: str = Form(""),
    skill_name: str = Form(""),
    title: str = Form(""),
    description: str = Form(""),
    tech_stack: str = Form(""),
    profile_details: str = Form("{}"),
    experiences: str = Form("[]"),
    resume: UploadFile | None = File(None),
    current_user: StudentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        details = json.loads(profile_details)
        experience_entries = json.loads(experiences)
    except json.JSONDecodeError as error:
        raise HTTPException(status_code=422, detail="Profile details must be valid JSON.") from error

    if not isinstance(details, dict) or not isinstance(experience_entries, list):
        raise HTTPException(status_code=422, detail="Profile details or experience entries have an invalid format.")

    student = db.query(Student).filter(Student.email == current_user.email).first()
    if student is None:
        student = Student(email=current_user.email)
        db.add(student)

    try:
        cgpa_value = float(cgpa) if cgpa.strip() else None
        backlogs_value = int(backlogs) if backlogs.strip() else None
        batch_year_value = int(batch_year) if batch_year.strip() else None
    except ValueError as error:
        raise HTTPException(status_code=422, detail="CGPA, backlogs, and graduation year must be valid numbers.") from error

    student.name = name.strip() or current_user.username
    student.email = current_user.email
    student.phone = phone.strip() or None
    student.branch = branch.strip() or None
    student.cgpa = cgpa_value
    student.backlogs = backlogs_value
    student.batch_year = batch_year_value
    student.skill_name = skill_name.strip() or None
    student.title = title.strip() or None
    student.description = description.strip() or None
    student.tech_stack = tech_stack.strip() or None
    student.profile_details = details

    for saved_experience in list(student.experiences):
        db.delete(saved_experience)
    student.experiences = []
    for entry in experience_entries:
        if not isinstance(entry, dict):
            raise HTTPException(status_code=422, detail="Each experience must be an object.")
        if not any(str(entry.get(field, "")).strip() for field in ("company", "role", "description")):
            continue

        try:
            start_date = date.fromisoformat(entry["start_date"]) if entry.get("start_date") else None
            end_date = date.fromisoformat(entry["end_date"]) if entry.get("end_date") else None
        except (TypeError, ValueError) as error:
            raise HTTPException(status_code=422, detail="Experience dates must use YYYY-MM-DD format.") from error
        if start_date and end_date and end_date < start_date:
            raise HTTPException(status_code=422, detail="Experience end date cannot be before its start date.")

        student.experiences.append(
            Experience(
                company=str(entry.get("company", "")).strip(),
                role=str(entry.get("role", "")).strip(),
                experience=str(entry.get("experience", "")).strip(),
                start_date=start_date,
                end_date=end_date,
            )
        )

    new_resume_path = None
    if resume and resume.filename:
        extension = Path(resume.filename).suffix.lower()
        if extension not in {".pdf", ".doc", ".docx"}:
            raise HTTPException(status_code=422, detail="Resume must be a PDF, DOC, or DOCX file.")
        resume_data = await resume.read(10 * 1024 * 1024 + 1)
        if len(resume_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Resume must be 10 MB or smaller.")

        upload_directory = Path(__file__).resolve().parents[3] / "uploads" / "resumes"
        upload_directory.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4()}{extension}"
        new_resume_path = upload_directory / filename
        new_resume_path.write_bytes(resume_data)
        student.resume = f"uploads/resumes/{filename}"
        student.resume_data = resume_data
        student.resume_filename = Path(resume.filename).name
        student.resume_content_type = (
            resume.content_type
            or mimetypes.guess_type(resume.filename)[0]
            or "application/octet-stream"
        )

    try:
        db.commit()
        db.refresh(student)
    except Exception as error:
        db.rollback()
        if new_resume_path is not None:
            new_resume_path.unlink(missing_ok=True)
        logger.exception("Failed to save employee profile for %s", current_user.email)
        raise HTTPException(status_code=500, detail="Your profile could not be saved.") from error

    return serialize_student(student)


# =========================================================
# CREATE STUDENT
# =========================================================

@router.post("/students")
async def create_student(

    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    branch: str = Form(...),

    cgpa: float = Form(...),
    backlogs: int = Form(...),
    batch_year: int = Form(...),

    skill_name: str = Form(...),

    title: str = Form(...),
    description: str = Form(...),
    tech_stack: str = Form(...),

    experiences: str = Form(...),

    resume: UploadFile = File(...),

    db: Session = Depends(get_db)

):
    new_resume_path: Path | None = None

    try:

        experiences_data = json.loads(experiences)
        if not isinstance(experiences_data, list):
            raise HTTPException(status_code=422, detail="Experiences must be a JSON list.")

        file_extension = Path(resume.filename or "").suffix.lower()
        if file_extension not in {".pdf", ".doc", ".docx"}:
            raise HTTPException(status_code=422, detail="Resume must be a PDF, DOC, or DOCX file.")
        resume_data = await resume.read(10 * 1024 * 1024 + 1)
        if len(resume_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Resume must be 10 MB or smaller.")

        upload_directory = Path(__file__).resolve().parents[3] / "uploads" / "resumes"
        upload_directory.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4()}{file_extension}"
        new_resume_path = upload_directory / filename
        new_resume_path.write_bytes(resume_data)
        file_path = f"uploads/resumes/{filename}"

        # =====================================================
        # CREATE STUDENT OBJECT
        # =====================================================

        db_student = Student(
            name=name,
            email=email,
            phone=phone,
            branch=branch,
            cgpa=cgpa,
            backlogs=backlogs,
            batch_year=batch_year,
            skill_name=skill_name,
            title=title,
            description=description,
            tech_stack=tech_stack,
            resume=file_path,
            resume_data=resume_data,
            resume_filename=Path(resume.filename or "").name,
            resume_content_type=(
                resume.content_type
                or mimetypes.guess_type(resume.filename or "")[0]
                or "application/octet-stream"
            ),
        )

        # =====================================================
        # ADD EXPERIENCES
        # =====================================================

        for exp in experiences_data:

            db_exp = Experience(

                company=exp["company"],
                role=exp["role"],
                experience=exp["experience"],

                start_date=datetime.strptime(
                    exp["start_date"],
                    "%Y-%m-%d"
                ).date(),

                end_date=datetime.strptime(
                    exp["end_date"],
                    "%Y-%m-%d"
                ).date()
            )

            db_student.experiences.append(db_exp)

        # =====================================================
        # SAVE TO DATABASE
        # =====================================================

        db.add(db_student)

        db.commit()

        db.refresh(db_student)

        # =====================================================
        # RETURN INSERTED DATA
        # =====================================================

        return {

            "id": db_student.id,

            "name": db_student.name,
            "email": db_student.email,
            "phone": db_student.phone,
            "branch": db_student.branch,

            "cgpa": db_student.cgpa,
            "backlogs": db_student.backlogs,
            "batch_year": db_student.batch_year,

            "skill_name": db_student.skill_name,

            "title": db_student.title,
            "description": db_student.description,
            "tech_stack": db_student.tech_stack,

            "resume": db_student.resume,

            "experiences": [

                {
                    "id": exp.id,
                    "company": exp.company,
                    "role": exp.role,
                    "experience": exp.experience,
                    "start_date": exp.start_date,
                    "end_date": exp.end_date
                }

                for exp in db_student.experiences
            ]
        }

    except HTTPException:
        db.rollback()
        if new_resume_path is not None:
            new_resume_path.unlink(missing_ok=True)
        raise
    except Exception as e:
        db.rollback()
        if new_resume_path is not None:
            new_resume_path.unlink(missing_ok=True)
        logger.exception("Failed to create employee profile for %s", email)

        raise HTTPException(
            status_code=500,
            detail="The employee profile could not be saved."
        )


# =========================================================
# GET ALL STUDENTS
# =========================================================

@router.get("/students")
def get_students(
    recruiter: Recruiter = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    if current_active_payment(db, recruiter.id) is None:
        raise HTTPException(
            status_code=403,
            detail="Choose and pay for a recruiter plan to view student profiles.",
        )

    students = db.query(Student).all()

    response = []

    for student in students:
        response.append(serialize_student(student))

    return response

# =========================================================
# GET SINGLE STUDENT BY ID
# =========================================================

@router.get("/students/{student_id}")
def get_student(
    student_id: int,
    recruiter: Recruiter = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    if current_active_payment(db, recruiter.id) is None:
        raise HTTPException(
            status_code=403,
            detail="Choose and pay for a recruiter plan to view student profiles.",
        )

    student = db.query(Student).filter(Student.id == student_id).first()

    if not student:
        return {"error": "Student not found"}

    return serialize_student(student)


@router.get("/students/{student_id}/resume")
def get_recruiter_student_resume(
    student_id: int,
    recruiter: Recruiter = Depends(get_current_recruiter),
    db: Session = Depends(get_db),
):
    if current_active_payment(db, recruiter.id) is None:
        raise HTTPException(
            status_code=403,
            detail="Choose and pay for a recruiter plan to view student profiles.",
        )

    student = db.query(Student).filter(Student.id == student_id).first()
    if student is None or student.resume_data is None:
        raise HTTPException(status_code=404, detail="No resume is available for this student.")

    filename = quote(Path(student.resume_filename or "resume").name, safe="")
    return Response(
        content=student.resume_data,
        media_type=student.resume_content_type or "application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )