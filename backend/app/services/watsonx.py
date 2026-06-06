import os
import json
import logging
import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Watsonx Configuration
WATSONX_API_KEY = os.getenv("WATSONX_API_KEY", "")
WATSONX_PROJECT_ID = os.getenv("WATSONX_PROJECT_ID", "")
WATSONX_URL = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com")
WATSONX_MODEL_ID = os.getenv("WATSONX_MODEL_ID", "ibm/granite-13b-chat-v2")

class WatsonxService:
    def __init__(self):
        self.api_key = WATSONX_API_KEY
        self.project_id = WATSONX_PROJECT_ID
        self.url = WATSONX_URL.rstrip('/')
        self.model_id = WATSONX_MODEL_ID
        self.access_token = None
        
        self.is_simulated = not (self.api_key and self.project_id)
        if self.is_simulated:
            logger.info("WatsonxService: No credentials found. Running in SIMULATED mode.")
        else:
            logger.info(f"WatsonxService: Configured for {self.url} using model {self.model_id}.")

    def _get_token(self):
        """Exchange IAM API key for a bearer token."""
        if self.is_simulated:
            return "simulated-token"
            
        try:
            token_url = "https://iam.cloud.ibm.com/identity/token"
            headers = {"Content-Type": "application/x-www-form-urlencoded"}
            data = {
                "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                "apikey": self.api_key
            }
            response = requests.post(token_url, headers=headers, data=data, timeout=15)
            response.raise_for_status()
            self.access_token = response.json().get("access_token")
            return self.access_token
        except Exception as e:
            logger.error(f"Error fetching Watsonx IAM token: {str(e)}")
            logger.info("Falling back to SIMULATOR due to authentication error.")
            self.is_simulated = True
            return "simulated-token"

    def generate_text(self, prompt: str, temperature: float = 0.2, max_tokens: int = 1500) -> str:
        """Generate text using IBM Granite via Watsonx.ai or the high-fidelity simulator."""
        if self.is_simulated:
            return self._simulate_generation(prompt)

        try:
            token = self._get_token()
            if self.is_simulated:
                return self._simulate_generation(prompt)

            endpoint = f"{self.url}/ml/v1/text/generation?version=2024-05-01"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            payload = {
                "model_id": self.model_id,
                "input": prompt,
                "project_id": self.project_id,
                "parameters": {
                    "decoding_method": "sample" if temperature > 0 else "greedy",
                    "max_new_tokens": max_tokens,
                    "temperature": temperature,
                    "repetition_penalty": 1.05
                }
            }
            
            response = requests.post(endpoint, headers=headers, json=payload, timeout=45)
            response.raise_for_status()
            res_json = response.json()
            
            # extract text
            results = res_json.get("results", [])
            if results:
                return results[0].get("generated_text", "")
            return ""
        except Exception as e:
            logger.error(f"Watsonx API call failed: {str(e)}")
            logger.info("Falling back to SIMULATOR for this request.")
            return self._simulate_generation(prompt)

    def get_embedding(self, text: str) -> list:
        """Get embedding vector (list of floats) for text."""
        if self.is_simulated:
            return self._simulate_embedding(text)

        try:
            token = self._get_token()
            if self.is_simulated:
                return self._simulate_embedding(text)

            endpoint = f"{self.url}/ml/v1/text/embeddings?version=2024-05-31"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            payload = {
                "inputs": [text],
                "model_id": "ibm/slate-125m-english-rtrvr",
                "project_id": self.project_id
            }
            
            response = requests.post(endpoint, headers=headers, json=payload, timeout=20)
            response.raise_for_status()
            res_json = response.json()
            
            results = res_json.get("results", [])
            if results:
                return results[0].get("embedding", [])
            return self._simulate_embedding(text)
        except Exception as e:
            logger.error(f"Watsonx Embedding API failed: {str(e)}")
            return self._simulate_embedding(text)

    def _simulate_embedding(self, text: str) -> list:
        """Generate a deterministic mock embedding vector based on the string hash."""
        val = hash(text) % 10000
        # return a 384 dimensional vector
        vector = []
        for i in range(384):
            # Deterministic pseudo-random number generation
            val = (val * 1103515245 + 12345) & 0x7fffffff
            vector.append((val % 2000 - 1000) / 1000.0)
        return vector

    def _simulate_generation(self, prompt: str) -> str:
        """High-fidelity local generator to simulate career agent outputs."""
        prompt_lower = prompt.lower()
        logger.info(f"SIMULATOR prompt len={len(prompt_lower)}. keywords: ats={'ats' in prompt_lower}, resume={'resume' in prompt_lower}, skill_gap={'skill gap' in prompt_lower}, roadmap={'roadmap' in prompt_lower}, career={'career' in prompt_lower}")
        # 1. Profile / ATS parsing simulation
        if "hr manager" in prompt_lower:
            # Look for indicators in prompt to make it somewhat realistic
            name = "Student"
            skills = "Python, Java"
            if "skills:" in prompt_lower:
                try:
                    skills = prompt.split("skills:")[1].split("\n")[0].strip()
                except: pass
                
            feedback = {
                "ats_score": 78,
                "parsed_profile": {
                    "skills": [s.strip() for s in skills.split(",") if s.strip()],
                    "education": "Bachelor of Technology",
                    "certifications": ["AWS Certified Cloud Practitioner"]
                },
                "weak_sections": [
                    "Resume lacks clear metrics or quantitative accomplishments (e.g. 'improved efficiency by 20%').",
                    "No links to GitHub or portfolio projects.",
                    "Summary section is too generic."
                ],
                "missing_skills": [
                    "Docker/Containers",
                    "SQL & Database Design",
                    "CI/CD Pipeline tools"
                ],
                "suggestions": [
                    "Quantify experience under projects with specific percentages or scale metrics.",
                    "Add a dedicated section for technical achievements and link your GitHub profile.",
                    "Include cloud platform skills and version control explicitly in the skills grid."
                ]
            }
            return json.dumps(feedback, indent=2)

        # 2. Skill Gap simulation
        elif "talent assessor" in prompt_lower:
            target = "Target Role"
            if "target career" in prompt_lower:
                try: target = prompt.split("target career:")[1].split("\n")[0].strip()
                except: pass
            elif "target role" in prompt_lower:
                try: target = prompt.split("target role:")[1].split("\n")[0].strip()
                except: pass
                
            gap_analysis = {
                "target_career": target,
                "existing_skills": ["Python", "HTML/CSS", "JavaScript", "Basic SQL", "Git"],
                "missing_skills": [
                    {
                        "name": "Docker & Kubernetes",
                        "priority": "High",
                        "estimated_effort": "Medium (2-3 weeks)",
                        "reason": "Crucial for microservice deployment and cloud native workflows in modern engineering."
                    },
                    {
                        "name": "Advanced Data Structures & Algorithms",
                        "priority": "High",
                        "estimated_effort": "High (4-6 weeks)",
                        "reason": "Essential for passing technical rounds at major tech firms."
                    },
                    {
                        "name": "Cloud Computing (AWS/GCP)",
                        "priority": "Medium",
                        "estimated_effort": "Medium (3 weeks)",
                        "reason": "Most companies deploy full-stack apps on cloud architectures."
                    },
                    {
                        "name": "System Design",
                        "priority": "Medium",
                        "estimated_effort": "High (3-4 weeks)",
                        "reason": "Needed to design scalable databases, load balancers, and caching."
                    }
                ],
                "strengths": [
                    "Solid fundamentals in programming language core syntax (Python/JS).",
                    "Experience with version control (Git).",
                    "Clear understanding of frontend basic presentation."
                ]
            }
            return json.dumps(gap_analysis, indent=2)

        # 3. Learning Roadmap simulation
        elif "technical educator" in prompt_lower:
            target = "Selected Career"
            if "target career" in prompt_lower:
                try: target = prompt.split("target career:")[1].split("\n")[0].strip()
                except: pass
                
            roadmap = {
                "target_career": target,
                "plan_30_day": {
                    "focus": "Core Fundamentals & Tools",
                    "topics": ["Advanced Python coding standards", "Relational Database Design (SQL)", "Docker Containerization basics"],
                    "courses": [
                        {"name": "Docker & Kubernetes: The Practical Guide (Udemy)", "provider": "Udemy"},
                        {"name": "Complete SQL Bootcamp (Coursera)", "provider": "Coursera"}
                    ],
                    "projects": ["Containerize an existing FastAPI web app and deploy it on a local cluster with PostgreSQL."]
                },
                "plan_90_day": {
                    "focus": "Cloud Deployments & Scalability",
                    "topics": ["Cloud Architecture (AWS Core Services)", "REST API optimization & caching", "CI/CD Deployment Pipelines"],
                    "courses": [
                        {"name": "AWS Certified Solutions Architect (Acclaim/FreeCodeCamp)", "provider": "FreeCodeCamp"},
                        {"name": "DevOps Engineering Foundations (LinkedIn Learning)", "provider": "LinkedIn"}
                    ],
                    "projects": ["Build a serverless image storage processor that triggers AWS Lambda and updates RDS databases automatically."]
                },
                "plan_180_day": {
                    "focus": "System Architecture & Deep Domain Prep",
                    "topics": ["High-level System Design (Scalability, Sharding)", "Mock Technical Coding Challenges", "Behavioral Interview Prep"],
                    "courses": [
                        {"name": "Grokking the System Design Interview (DesignGurus)", "provider": "DesignGurus"}
                    ],
                    "projects": ["Design and implement a distributed rate-limiter and url-shortener capable of handling 10k requests per second."]
                }
            }
            return json.dumps(roadmap, indent=2)

        # 4. Career Recommendation simulation
        elif "career counselor" in prompt_lower:
            interests = "coding"
            if "interests:" in prompt_lower:
                try: interests = prompt.split("interests:")[1].split("\n")[0].strip()
                except: pass
            
            recommendations = [
                {
                    "title": "AI/ML Engineer",
                    "reasoning": f"Based on your interest in {interests} and strong programming background. You demonstrate interest in data science and algorithmic problem solving.",
                    "future_opportunities": "Rapidly growing field. High demand for engineers who can deploy large models and run fine-tuning pipelines.",
                    "salary_range": "$95,000 - $140,000",
                    "demand_score": 95,
                    "demand_level": "Critical"
                },
                {
                    "title": "Full-Stack Software Engineer",
                    "reasoning": f"Matches your active project work in web dev and coding. Full stack gives you direct visibility into client features and system layout.",
                    "future_opportunities": "Steady enterprise and startup demand. Potential to grow into a Solutions Architect or Tech Lead.",
                    "salary_range": "$85,000 - $125,000",
                    "demand_score": 88,
                    "demand_level": "High"
                },
                {
                    "title": "Data Scientist / Analyst",
                    "reasoning": f"Complements your analytical skills and coursework in mathematics or stats. Suitable for extracting key product insights.",
                    "future_opportunities": "Organizations are increasingly data-driven. Strong career progression towards Lead Data Scientist or Chief Data Officer.",
                    "salary_range": "$90,000 - $130,000",
                    "demand_score": 85,
                    "demand_level": "High"
                }
            ]
            return json.dumps(recommendations, indent=2)

        # 5. Default generic simulation
        else:
            return "Based on analysis, you should focus on sharpening your technical skills in Python, Git, databases, and DevOps methodologies to progress in your computer science path. Continue building hands-on projects."
