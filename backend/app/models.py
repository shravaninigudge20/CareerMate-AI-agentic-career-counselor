from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="student") # student or admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    career_recommendations = relationship("CareerRecommendation", back_populates="user", cascade="all, delete-orphan")
    skill_gap_analyses = relationship("SkillGapAnalysis", back_populates="user", cascade="all, delete-orphan")
    roadmaps = relationship("LearningRoadmap", back_populates="user", cascade="all, delete-orphan")
    interview_preps = relationship("InterviewPrep", back_populates="user", cascade="all, delete-orphan")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String, nullable=False)
    branch = Column(String, nullable=False)
    academic_year = Column(String, nullable=False)
    cgpa = Column(Float, nullable=False)
    skills = Column(Text, nullable=True)          # JSON-encoded list of skills
    interests = Column(Text, nullable=True)       # JSON-encoded list of interests
    career_goals = Column(Text, nullable=True)    # JSON-encoded list/string of career goals
    certifications = Column(Text, nullable=True)  # JSON-encoded list of certifications
    resume_filename = Column(String, nullable=True)
    resume_text = Column(Text, nullable=True)
    ats_score = Column(Integer, default=0)
    ats_feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")

class CareerRecommendation(Base):
    __tablename__ = "career_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # The agent recommendation response is stored as JSON or a structured response
    recommendations_json = Column(Text, nullable=False) # JSON list of career paths
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="career_recommendations")

class SkillGapAnalysis(Base):
    __tablename__ = "skill_gap_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_career = Column(String, nullable=False)
    analysis_json = Column(Text, nullable=False) # JSON structure containing gaps, strengths, priority, effort
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="skill_gap_analyses")

class LearningRoadmap(Base):
    __tablename__ = "learning_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_career = Column(String, nullable=False)
    roadmap_json = Column(Text, nullable=False) # JSON structure containing 30, 90, 180 days roadmaps
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="roadmaps")

class InterviewPrep(Base):
    __tablename__ = "interview_preps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_career = Column(String, nullable=False)
    prep_json = Column(Text, nullable=False) # JSON structure of technical, HR, behavioral Q&As
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="interview_preps")
