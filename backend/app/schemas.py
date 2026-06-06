from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Optional, Any
import datetime

# Authentication Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str
    role: Optional[str] = "student"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str
    name: str
    role: str

# Profile Schemas
class StudentProfileCreate(BaseModel):
    name: str
    branch: str
    academic_year: str
    cgpa: float = Field(..., ge=0.0, le=10.0)
    skills: str  # Comma-separated list
    interests: str  # Comma-separated list
    career_goals: str
    certifications: Optional[str] = ""

class StudentProfileResponse(BaseModel):
    id: int
    user_id: int
    name: str
    branch: str
    academic_year: str
    cgpa: float
    skills: Optional[str]
    interests: Optional[str]
    career_goals: Optional[str]
    certifications: Optional[str]
    resume_filename: Optional[str]
    ats_score: int
    ats_feedback: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Career Recommendation Schemas
class CareerPath(BaseModel):
    title: str
    reasoning: str
    future_opportunities: str
    salary_range: str
    demand_score: int
    demand_level: str

class CareerRecommendationResponse(BaseModel):
    id: int
    user_id: int
    recommendations: List[CareerPath]
    created_at: datetime.datetime

# Skill Gap Schemas
class SkillGapRequest(BaseModel):
    target_career: str

class MissingSkill(BaseModel):
    name: str
    priority: str
    estimated_effort: str
    reason: str

class SkillGapResponse(BaseModel):
    target_career: str
    existing_skills: List[str]
    missing_skills: List[MissingSkill]
    strengths: List[str]

# Roadmap Schemas
class RoadmapRequest(BaseModel):
    target_career: str

class CourseItem(BaseModel):
    name: str
    provider: str

class PhasePlan(BaseModel):
    focus: str
    topics: List[str]
    courses: List[CourseItem]
    projects: List[str]

class RoadmapResponse(BaseModel):
    target_career: str
    plan_30_day: PhasePlan
    plan_90_day: PhasePlan
    plan_180_day: PhasePlan
