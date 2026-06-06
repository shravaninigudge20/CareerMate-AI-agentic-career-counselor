import json
import logging
from ..services.watsonx import WatsonxService

logger = logging.getLogger(__name__)

class RoadmapAgent:
    def __init__(self, watsonx_service: WatsonxService):
        self.watsonx_service = watsonx_service

    def generate_roadmap(self, target_career: str, gap_analysis_data: dict) -> dict:
        """Generate a 30-day, 90-day, and 180-day learning roadmap tailored to the student's gaps."""
        
        missing_skills_list = []
        if "missing_skills" in gap_analysis_data:
            for skill in gap_analysis_data["missing_skills"]:
                if isinstance(skill, dict):
                    missing_skills_list.append(f"{skill.get('name', '')} (Priority: {skill.get('priority', 'High')})")
                else:
                    missing_skills_list.append(str(skill))
                    
        missing_skills_str = ", ".join(missing_skills_list)
        
        prompt = f"""
You are an expert Technical Educator and Curriculum Designer.
Generate a structured, step-by-step learning roadmap for a student aiming to become a "{target_career}".
Focus on bridging these specific gaps: {missing_skills_str}

Create an actionable timeline split into three phases:
1. "plan_30_day" (Short-term focus: Core fundamentals and quick-wins)
2. "plan_90_day" (Mid-term focus: Advanced topics and tool integrations)
3. "plan_180_day" (Long-term focus: Full mastery, systems, certifications, and job readiness)

For each phase, provide:
- "focus": A string describing the central theme.
- "topics": A list of specific concepts to study.
- "courses": A list of dictionaries with "name" and "provider" (e.g. Coursera, Udemy, FreeCodeCamp) representing recommended classes.
- "projects": A list of hands-on project ideas to build to apply the knowledge.

Response must be pure JSON matching the structure below, with no markdown formatting, no backticks, no comments.
JSON format:
{{
  "target_career": "{target_career}",
  "plan_30_day": {{
    "focus": "Core Fundamentals",
    "topics": ["Topic A", "Topic B"],
    "courses": [
      {{"name": "Course Name", "provider": "Provider Name"}}
    ],
    "projects": ["Project details"]
  }},
  "plan_90_day": {{
    "focus": "Advanced Tools",
    "topics": ["Topic C"],
    "courses": [],
    "projects": []
  }},
  "plan_180_day": {{
    "focus": "Mastery",
    "topics": ["Topic D"],
    "courses": [],
    "projects": []
  }}
}}
"""
        response_text = self.watsonx_service.generate_text(prompt, temperature=0.2, max_tokens=1500)
        
        try:
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```"):
                lines = cleaned_text.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                cleaned_text = "\n".join(lines).strip()
                
            result = json.loads(cleaned_text)
            return result
        except Exception as e:
            logger.error(f"RoadmapAgent failed to parse JSON: {str(e)}. Raw text: {response_text}")
            
            # Simulated fallback if parsing fails
            return {
                "target_career": target_career,
                "plan_30_day": {
                    "focus": "Core Tooling & Environment Setup",
                    "topics": ["Docker containers", "Relational Database queries", "Core backend APIs"],
                    "courses": [
                        {"name": "Docker for Beginners", "provider": "FreeCodeCamp"},
                        {"name": "SQL Boot Camp", "provider": "Udemy"}
                    ],
                    "projects": ["Build and containerize a simple FastAPI backend."]
                },
                "plan_90_day": {
                    "focus": "Cloud Architecture & Integration",
                    "topics": ["Cloud deployment (AWS EC2/S3)", "CI/CD configuration", "Unit testing & Mocking"],
                    "courses": [
                        {"name": "AWS Developer Associate", "provider": "Coursera"}
                    ],
                    "projects": ["Automate a deployment pipeline using GitHub Actions to deploy to AWS."]
                },
                "plan_180_day": {
                    "focus": "Scalability & Full Interview Readiness",
                    "topics": ["System design scalability", "Data structures practice", "Behavioral interview prep"],
                    "courses": [
                        {"name": "Grokking the System Design Interview", "provider": "DesignGurus"}
                    ],
                    "projects": ["Implement a microservice architecture with load balancing."]
                }
            }
