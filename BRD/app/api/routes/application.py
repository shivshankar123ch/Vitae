# from fastapi import APIRouter, Depends
# # from sqlalchemy.orm import Session
# # from app.models.application import Application
# from app.schemas.application import ApplicationCreate
# from app.api.deps import get_db
# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session

# from app.schemas.application import ApplicationCreate
# from app.api.deps import get_db
# from app.models.application import Application   # (you also need this!)


# router = APIRouter(prefix="/applications", tags=["Applications"])

# @router.post("/apply")
# def apply_job(data: ApplicationCreate, db: Session = Depends(get_db)):
#     app = Application(**data.dict(), status="applied")
#     db.add(app)
#     db.commit()
#     db.refresh(app)
#     return app

# @router.get("/")
# def get_applications(db: Session = Depends(get_db)):
#     return db.query(Application).all()

# # Shortlisting logic
# @router.post("/shortlist/{application_id}")
# def shortlist(application_id: int, db: Session = Depends(get_db)):
#     app = db.query(Application).get(application_id)
#     app.status = "shortlisted"
#     db.commit()
#     return {"message": "Student shortlisted"}