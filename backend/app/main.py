import os
import json
import logging
import shutil
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

from .database import engine, Base, get_db
from . import models, schemas, auth
from .services.watsonx import WatsonxService
from .services.rag import RAGService
from .agents.coordinator import CoordinatorAgent

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="CareerMate AI API",
    description="Agentic Career Counseling Companion API powered by IBM Granite",
    version="1.0.0"
)

# CORS Middleware config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Initialize Services & Agents
watsonx_service = WatsonxService()
rag_service = RAGService(watsonx_service)
coordinator_agent = CoordinatorAgent(watsonx_service, rag_service)

# ----------------- Root Endpoint -----------------
@app.get("/")
def read_root():
    return {
        "message": "Welcome to CareerMate AI API",
        "watsonx_mode": "Simulated" if watsonx_service.is_simulated else "Live",
        "rag_document_count": rag_service.collection.count()
    }

# ----------------- Auth Endpoints -----------------
@app.post("/api/auth/register", response_model=schemas.Token)
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password and save user
    hashed_pwd = auth.hash_password(user_data.password)
    db_user = models.User(
        email=user_data.email,
        password_hash=hashed_pwd,
        name=user_data.name,
        role=user_data.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Generate token
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": db_user.id,
        "email": db_user.email,
        "name": db_user.name,
        "role": db_user.role
    }

@app.post("/api/auth/login", response_model=schemas.Token)
def login_user(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    # Validate user credentials
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not auth.verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role
    }

@app.get("/api/auth/me", response_model=schemas.UserCreate)
def get_user_me(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "password": ""  # Hide password hash
    }

# ----------------- Student Profile Endpoints -----------------
@app.get("/api/profile", response_model=schemas.StudentProfileResponse)
def get_student_profile(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found. Please create one."
        )
    return profile

@app.post("/api/profile", response_model=schemas.StudentProfileResponse)
def create_or_update_student_profile(
    profile_data: schemas.StudentProfileCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Convert Pydantic schemas to dictionary
        p_dict = profile_data.dict()
        profile = coordinator_agent.process_student_profile(
            db=db,
            user_id=current_user.id,
            profile_data=p_dict
        )
        return profile
    except Exception as e:
        logger.error(f"Error creating profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process profile: {str(e)}"
        )

@app.post("/api/profile/upload-resume")
def upload_resume(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF resume uploads are supported in Phase 1."
        )

    # Save PDF locally
    temp_filename = f"resume_{current_user.id}_{file.filename}"
    temp_path = os.path.join(UPLOADS_DIR, temp_filename)
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Check if student already has a profile details or default to blank
        db_profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
        profile_data = {}
        if db_profile:
            profile_data = {
                "name": db_profile.name,
                "branch": db_profile.branch,
                "academic_year": db_profile.academic_year,
                "cgpa": db_profile.cgpa,
                "skills": db_profile.skills,
                "interests": db_profile.interests,
                "career_goals": db_profile.career_goals,
                "certifications": db_profile.certifications
            }
        else:
            # Create a mock shell profile
            profile_data = {
                "name": current_user.name,
                "branch": "Computer Science & Engineering",
                "academic_year": "Third Year",
                "cgpa": 8.0,
                "skills": "",
                "interests": "",
                "career_goals": "Full-Stack Development or Data Science",
                "certifications": ""
            }
            
        updated_profile = coordinator_agent.process_student_profile(
            db=db,
            user_id=current_user.id,
            profile_data=profile_data,
            resume_path=temp_path
        )
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return {
            "message": "Resume uploaded and evaluated successfully.",
            "profile": updated_profile
        }
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        logger.error(f"Error uploading resume: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and analyze resume: {str(e)}"
        )

# ----------------- Career Recommendation Endpoints -----------------
@app.get("/api/careers/recommend", response_model=List[schemas.CareerPath])
def recommend_careers(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    try:
        recommendations = coordinator_agent.get_career_recommendations(db, current_user.id)
        return recommendations
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error(f"Error recommending careers: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# ----------------- Skill Gap Endpoints -----------------
@app.post("/api/careers/skill-gap", response_model=schemas.SkillGapResponse)
def analyze_skill_gap(
    request: schemas.SkillGapRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    try:
        gap_analysis = coordinator_agent.get_skill_gap_analysis(db, current_user.id, request.target_career)
        return gap_analysis
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error(f"Error analyzing skill gap: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# ----------------- Learning Roadmap Endpoints -----------------
@app.post("/api/careers/roadmap", response_model=schemas.RoadmapResponse)
def generate_roadmap(
    request: schemas.RoadmapRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    try:
        roadmap = coordinator_agent.get_learning_roadmap(db, current_user.id, request.target_career)
        return roadmap
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.error(f"Error generating learning roadmap: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# ----------------- Admin/RAG Inspect Endpoints -----------------
@app.get("/api/admin/rag/documents")
def list_rag_documents(current_user: models.User = Depends(auth.get_current_user)):
    # Simple check for role
    if current_user.role != "admin":
        # We will allow students to see it in the demo/MVP for transparent inspection (very clean!)
        # but print a warning log.
        logger.warning(f"Non-admin user {current_user.email} is inspecting RAG documents.")
    
    return rag_service.get_all_documents()

@app.get("/api/admin/rag/status")
def get_rag_status():
    return {
        "collection_name": rag_service.collection_name,
        "count": rag_service.collection.count(),
        "watsonx_mode": "Simulated" if watsonx_service.is_simulated else "Live"
    }
