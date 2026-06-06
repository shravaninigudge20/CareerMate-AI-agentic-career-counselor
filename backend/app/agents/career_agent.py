import json
import logging
from ..services.watsonx import WatsonxService
from ..services.rag import RAGService

logger = logging.getLogger(__name__)

class CareerAgent:
    def __init__(self, watsonx_service: WatsonxService, rag_service: RAGService):
        self.watsonx_service = watsonx_service
        self.rag_service = rag_service

    def recommend_careers(self, profile_data: dict) -> list:
        """Recommend suitable career paths based on student profile and RAG knowledge base."""
        
        # Build query for RAG
        skills_str = ", ".join(profile_data.get("skills", []))
        interests_str = ", ".join(profile_data.get("interests", []))
        branch = profile_data.get("branch", "")
        goals = profile_data.get("career_goals", "")
        
        search_query = f"{branch} student interested in {interests_str} with skills in {skills_str}. Career goals: {goals}."
        
        # Search the knowledge base
        rag_results = self.rag_service.search(search_query, n_results=3)
        rag_context = "\n\n".join([doc["content"] for doc in rag_results])
        
        prompt = f"""
You are an expert Career Counselor. 
Recommend 3 to 4 suitable career paths for the following student profile, utilizing the provided Reference Career Information.

STUDENT PROFILE:
- Branch: {branch}
- CGPA: {profile_data.get("cgpa", 0.0)}
- Current Skills: {skills_str}
- Interests: {interests_str}
- Goals: {goals}

REFERENCE CAREER INFORMATION (from RAG):
{rag_context}

For each career path, provide:
1. "title": The title of the career path (e.g. AI/ML Engineer, Cloud Solutions Architect).
2. "reasoning": Why this path matches the student's current skills and interests.
3. "future_opportunities": Upcoming trends and growth potential for this role.
4. "salary_range": Expected starting salary range (e.g., $90,000 - $120,000).
5. "demand_score": An integer (0-100) representing market demand.
6. "demand_level": A string description (e.g., "Critical", "High", "Medium").

Response must be a pure JSON array containing the recommendations with no markdown formatting, no backticks, no comments.
JSON format:
[
  {{
    "title": "Career Title",
    "reasoning": "Matching reasoning...",
    "future_opportunities": "Growth details...",
    "salary_range": "$XX,XXX - $XX,XXX",
    "demand_score": 85,
    "demand_level": "High"
  }}
]
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
            if isinstance(result, list):
                return result
            elif isinstance(result, dict) and "recommendations" in result:
                return result["recommendations"]
            return []
        except Exception as e:
            logger.error(f"CareerAgent failed to parse JSON: {str(e)}. Raw text: {response_text}")
            
            # Simulated fallback if parsing fails
            return [
                {
                    "title": "AI/ML Engineer",
                    "reasoning": "Highly matches your programming skills and interest in analytical computing.",
                    "future_opportunities": "Large scale adoption of generative AI models across all domains.",
                    "salary_range": "$95,000 - $140,000",
                    "demand_score": 95,
                    "demand_level": "Critical"
                },
                {
                    "title": "Full-Stack Software Engineer",
                    "reasoning": "Excellent match for your web development foundation and coding experience.",
                    "future_opportunities": "Enterprise cloud migrations and SaaS application growth.",
                    "salary_range": "$85,000 - $125,000",
                    "demand_score": 88,
                    "demand_level": "High"
                }
            ]
