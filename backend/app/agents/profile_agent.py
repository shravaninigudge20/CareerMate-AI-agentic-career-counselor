import json
import logging
from ..services.watsonx import WatsonxService

logger = logging.getLogger(__name__)

class ProfileAgent:
    def __init__(self, watsonx_service: WatsonxService):
        self.watsonx_service = watsonx_service

    def analyze_profile(self, name: str, branch: str, academic_year: str, cgpa: float,
                        skills: str, interests: str, career_goals: str,
                        certifications: str, resume_text: str = None) -> dict:
        """Analyze student details and resume text to generate a comprehensive profile summary and ATS score."""
        
        prompt = f"""
You are an expert HR Manager and Technical Recruiter.
Analyze the following student profile and resume content:

Name: {name}
Branch/Major: {branch}
Academic Year: {academic_year}
CGPA: {cgpa}
Skills Entered: {skills}
Interests Entered: {interests}
Career Goals: {career_goals}
Certifications Entered: {certifications}

Resume Text:
{resume_text or "No resume uploaded."}

Evaluate their ATS compatibility and profile completeness. 
Generate a JSON object containing:
1. "ats_score": An integer score (0-100) reflecting their profile strength and ATS readiness.
2. "parsed_profile": A dictionary with keys "skills" (list of strings), "education" (string), "certifications" (list of strings).
3. "weak_sections": A list of strings identifying weak areas in their profile/resume.
4. "missing_skills": A list of critical industry-standard skills they lack based on their branch and goals.
5. "suggestions": A list of actionable suggestions to improve their resume and ATS score.

Response must be pure JSON with no markdown wrapping, no backticks, no trailing comments.
JSON format:
{{
  "ats_score": 75,
  "parsed_profile": {{
    "skills": ["Skill1", "Skill2"],
    "education": "Degree details",
    "certifications": ["Cert1"]
  }},
  "weak_sections": ["Weakness 1", "Weakness 2"],
  "missing_skills": ["Missing Skill 1"],
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}}
"""
        response_text = self.watsonx_service.generate_text(prompt, temperature=0.1, max_tokens=1000)
        
        try:
            # Clean response text in case LLM wraps it in markdown backticks
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```"):
                # strip out ```json and ```
                lines = cleaned_text.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                cleaned_text = "\n".join(lines).strip()
                
            result = json.loads(cleaned_text)
            return result
        except Exception as e:
            logger.error(f"ProfileAgent failed to parse JSON response: {str(e)}. Raw text: {response_text}")
            # Safe fallback
            skills_list = [s.strip() for s in skills.split(",") if s.strip()]
            certs_list = [c.strip() for c in certifications.split(",") if c.strip()]
            return {
                "ats_score": 70 if resume_text else 50,
                "parsed_profile": {
                    "skills": skills_list if skills_list else ["Python", "Problem Solving"],
                    "education": f"Bachelor's in {branch}",
                    "certifications": certs_list if certs_list else []
                },
                "weak_sections": ["Resume parsing failed or was incomplete.", "Lacks quantitative metrics for projects."],
                "missing_skills": ["SQL Database Administration", "Docker", "DevOps Pipelines"],
                "suggestions": ["Add GitHub project links to your profile.", "Revise the summary to target your career goals."]
            }
