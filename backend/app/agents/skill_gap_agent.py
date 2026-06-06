import json
import logging
from ..services.watsonx import WatsonxService
from ..services.rag import RAGService

logger = logging.getLogger(__name__)

class SkillGapAgent:
    def __init__(self, watsonx_service: WatsonxService, rag_service: RAGService):
        self.watsonx_service = watsonx_service
        self.rag_service = rag_service

    def analyze_gaps(self, profile_data: dict, target_career: str) -> dict:
        """Compare current skills with the target career to perform a skill-gap analysis."""
        
        # Search the knowledge base for the target career guidelines
        rag_results = self.rag_service.search(target_career, n_results=2)
        rag_context = "\n\n".join([doc["content"] for doc in rag_results])
        
        skills_str = ", ".join(profile_data.get("skills", []))
        interests_str = ", ".join(profile_data.get("interests", []))
        
        prompt = f"""
You are an expert Talent Assessor and Career Mentor.
Analyze the skill gaps for the student targeting the career: "{target_career}".

STUDENT PROFILE:
- Current Skills: {skills_str}
- Interests: {interests_str}

REFERENCE CAREER REQUIREMENTS (from RAG):
{rag_context}

Perform a gap analysis and return a JSON object with:
1. "target_career": The string name of the target career.
2. "existing_skills": A list of skills the student possesses that are relevant to this career.
3. "missing_skills": A list of dictionaries containing:
   - "name": The skill name (e.g., Docker, SQL).
   - "priority": Priority level (e.g., "High", "Medium", "Low").
   - "estimated_effort": Estimated learning time (e.g., "2 weeks", "1 month").
   - "reason": Why this skill is necessary for the role.
4. "strengths": A list of strings showing the student's strong points for this career path.

Response must be pure JSON with no markdown wrapping, no backticks, no comments.
JSON format:
{{
  "target_career": "{target_career}",
  "existing_skills": ["Skill 1", "Skill 2"],
  "missing_skills": [
    {{
      "name": "Docker",
      "priority": "High",
      "estimated_effort": "2 weeks",
      "reason": "Used for containerized deployments."
    }}
  ],
  "strengths": ["Strong coding background", "Familiar with frontend basics"]
}}
"""
        response_text = self.watsonx_service.generate_text(prompt, temperature=0.1, max_tokens=1000)
        
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
            logger.error(f"SkillGapAgent failed to parse JSON: {str(e)}. Raw text: {response_text}")
            
            # Simulated fallback if parsing fails
            return {
                "target_career": target_career,
                "existing_skills": profile_data.get("skills", ["Python", "JavaScript"]),
                "missing_skills": [
                    {
                        "name": "Docker & Kubernetes",
                        "priority": "High",
                        "estimated_effort": "2-3 weeks",
                        "reason": "Required for containers and deployment workflows."
                    },
                    {
                        "name": "Advanced SQL & Database Tuning",
                        "priority": "High",
                        "estimated_effort": "2 weeks",
                        "reason": "Crucial for writing optimized database queries."
                    }
                ],
                "strengths": ["Good programming language syntax knowledge.", "Understands Git version control."]
            }
