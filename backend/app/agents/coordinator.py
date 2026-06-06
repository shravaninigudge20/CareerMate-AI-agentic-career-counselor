import os
import json
import logging
import pypdf
from sqlalchemy.orm import Session
from .. import models
from .profile_agent import ProfileAgent
from .career_agent import CareerAgent
from .skill_gap_agent import SkillGapAgent
from .roadmap_agent import RoadmapAgent
from ..services.watsonx import WatsonxService
from ..services.rag import RAGService

logger = logging.getLogger(__name__)

def extract_text_from_pdf(pdf_path: str) -> str:
    """Helper function to extract raw text from a PDF resume file."""
    if not os.path.exists(pdf_path):
        logger.warning(f"Resume PDF path not found: {pdf_path}")
        return ""
        
    try:
        reader = pypdf.PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"Failed to parse PDF resume at {pdf_path}: {str(e)}")
        return ""

class CoordinatorAgent:
    def __init__(self, watsonx_service: WatsonxService, rag_service: RAGService):
        self.watsonx_service = watsonx_service
        self.rag_service = rag_service
        
        self.profile_agent = ProfileAgent(watsonx_service)
        self.career_agent = CareerAgent(watsonx_service, rag_service)
        self.skill_gap_agent = SkillGapAgent(watsonx_service, rag_service)
        self.roadmap_agent = RoadmapAgent(watsonx_service)

    def process_student_profile(self, db: Session, user_id: int, profile_data: dict, resume_path: str = None) -> models.StudentProfile:
        """Parses the student profile, extracts text from resume PDF if available, runs Profile Agent for ATS scoring, and saves to DB."""
        resume_text = ""
        resume_filename = None
        
        if resume_path:
            resume_filename = os.path.basename(resume_path)
            resume_text = extract_text_from_pdf(resume_path)
            logger.info(f"Extracted {len(resume_text)} characters from resume {resume_filename}")
            
        # Compile existing profile info
        name = profile_data.get("name", "")
        branch = profile_data.get("branch", "")
        academic_year = profile_data.get("academic_year", "")
        cgpa = float(profile_data.get("cgpa", 0.0))
        skills = profile_data.get("skills", "")
        interests = profile_data.get("interests", "")
        career_goals = profile_data.get("career_goals", "")
        certifications = profile_data.get("certifications", "")

        # Call ProfileAgent for ATS analysis
        analysis = self.profile_agent.analyze_profile(
            name=name,
            branch=branch,
            academic_year=academic_year,
            cgpa=cgpa,
            skills=skills,
            interests=interests,
            career_goals=career_goals,
            certifications=certifications,
            resume_text=resume_text
        )

        # Retrieve or create profile
        db_profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
        
        # Flatten extracted skills and certifications back to comma-separated string if the agent parsed them
        parsed_skills = skills
        parsed_certs = certifications
        
        if "parsed_profile" in analysis:
            extracted_skills = analysis["parsed_profile"].get("skills", [])
            if extracted_skills:
                parsed_skills = ", ".join(extracted_skills)
            
            extracted_certs = analysis["parsed_profile"].get("certifications", [])
            if extracted_certs:
                parsed_certs = ", ".join(extracted_certs)

        if not db_profile:
            db_profile = models.StudentProfile(
                user_id=user_id,
                name=name,
                branch=branch,
                academic_year=academic_year,
                cgpa=cgpa,
                skills=parsed_skills,
                interests=interests,
                career_goals=career_goals,
                certifications=parsed_certs,
                resume_filename=resume_filename,
                resume_text=resume_text if resume_text else None,
                ats_score=analysis.get("ats_score", 0),
                ats_feedback=json.dumps({
                    "weak_sections": analysis.get("weak_sections", []),
                    "missing_skills": analysis.get("missing_skills", []),
                    "suggestions": analysis.get("suggestions", [])
                })
            )
            db.add(db_profile)
        else:
            db_profile.name = name
            db_profile.branch = branch
            db_profile.academic_year = academic_year
            db_profile.cgpa = cgpa
            db_profile.skills = parsed_skills
            db_profile.interests = interests
            db_profile.career_goals = career_goals
            db_profile.certifications = parsed_certs
            if resume_path:
                db_profile.resume_filename = resume_filename
                db_profile.resume_text = resume_text
            db_profile.ats_score = analysis.get("ats_score", db_profile.ats_score)
            db_profile.ats_feedback = json.dumps({
                "weak_sections": analysis.get("weak_sections", []),
                "missing_skills": analysis.get("missing_skills", []),
                "suggestions": analysis.get("suggestions", [])
            })
            
        db.commit()
        db.refresh(db_profile)
        return db_profile

    def get_career_recommendations(self, db: Session, user_id: int) -> list:
        """Invokes Career Agent to matching careers based on student profile and saves to DB."""
        db_profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
        if not db_profile:
            raise ValueError("Student profile not found. Please complete your profile first.")

        # Reformat profile data for the agent
        profile_dict = {
            "branch": db_profile.branch,
            "cgpa": db_profile.cgpa,
            "skills": [s.strip() for s in db_profile.skills.split(",") if s.strip()] if db_profile.skills else [],
            "interests": [i.strip() for i in db_profile.interests.split(",") if i.strip()] if db_profile.interests else [],
            "career_goals": db_profile.career_goals,
            "certifications": [c.strip() for c in db_profile.certifications.split(",") if c.strip()] if db_profile.certifications else []
        }

        # Run CareerAgent
        recommendations = self.career_agent.recommend_careers(profile_dict)

        # Save to database
        db_rec = db.query(models.CareerRecommendation).filter(models.CareerRecommendation.user_id == user_id).first()
        if not db_rec:
            db_rec = models.CareerRecommendation(
                user_id=user_id,
                recommendations_json=json.dumps(recommendations)
            )
            db.add(db_rec)
        else:
            db_rec.recommendations_json = json.dumps(recommendations)
            
        db.commit()
        return recommendations

    def get_skill_gap_analysis(self, db: Session, user_id: int, target_career: str) -> dict:
        """Invokes Skill Gap Agent to compare student skills with target career and saves to DB."""
        db_profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
        if not db_profile:
            raise ValueError("Student profile not found. Please complete your profile first.")

        profile_dict = {
            "skills": [s.strip() for s in db_profile.skills.split(",") if s.strip()] if db_profile.skills else [],
            "interests": [i.strip() for i in db_profile.interests.split(",") if i.strip()] if db_profile.interests else []
        }

        # Run SkillGapAgent
        gap_analysis = self.skill_gap_agent.analyze_gaps(profile_dict, target_career)

        # Save to database
        db_gap = db.query(models.SkillGapAnalysis).filter(
            models.SkillGapAnalysis.user_id == user_id, 
            models.SkillGapAnalysis.target_career == target_career
        ).first()
        
        if not db_gap:
            db_gap = models.SkillGapAnalysis(
                user_id=user_id,
                target_career=target_career,
                analysis_json=json.dumps(gap_analysis)
            )
            db.add(db_gap)
        else:
            db_gap.analysis_json = json.dumps(gap_analysis)
            
        db.commit()
        return gap_analysis

    def get_learning_roadmap(self, db: Session, user_id: int, target_career: str) -> dict:
        """Invokes Roadmap Agent to create a 30-90-180 day guide and saves to DB."""
        # Check if we have gap analysis for this career first
        db_gap = db.query(models.SkillGapAnalysis).filter(
            models.SkillGapAnalysis.user_id == user_id, 
            models.SkillGapAnalysis.target_career == target_career
        ).first()
        
        if db_gap:
            gap_analysis = json.loads(db_gap.analysis_json)
        else:
            # Generate gap analysis on-the-fly
            gap_analysis = self.get_skill_gap_analysis(db, user_id, target_career)

        # Run RoadmapAgent
        roadmap = self.roadmap_agent.generate_roadmap(target_career, gap_analysis)

        # Save to database
        db_road = db.query(models.LearningRoadmap).filter(
            models.LearningRoadmap.user_id == user_id,
            models.LearningRoadmap.target_career == target_career
        ).first()
        
        if not db_road:
            db_road = models.LearningRoadmap(
                user_id=user_id,
                target_career=target_career,
                roadmap_json=json.dumps(roadmap)
            )
            db.add(db_road)
        else:
            db_road.roadmap_json = json.dumps(roadmap)
            
        db.commit()
        return roadmap
