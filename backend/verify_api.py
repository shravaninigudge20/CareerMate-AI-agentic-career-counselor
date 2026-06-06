import sys
import os
import json

# Ensure app can be imported
sys.path.append(os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine

# Recreate tables for clean test run
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_flow():
    print("=== STARTING BACKEND API VERIFICATION ===")
    
    # 1. Register User
    print("\n1. Testing User Registration...")
    reg_data = {
        "email": "student@test.com",
        "password": "securepassword123",
        "name": "Test Student",
        "role": "student"
    }
    response = client.post("/api/auth/register", json=reg_data)
    print(f"Status Code: {response.status_code}")
    assert response.status_code == 200, "Registration failed"
    res_json = response.json()
    token = res_json["access_token"]
    user_id = res_json["user_id"]
    print(f"User registered with ID: {user_id}")
    
    # Header helper
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Login User
    print("\n2. Testing User Login...")
    login_data = {
        "email": "student@test.com",
        "password": "securepassword123"
    }
    response = client.post("/api/auth/login", json=login_data)
    print(f"Status Code: {response.status_code}")
    assert response.status_code == 200, "Login failed"
    print("Login successful.")

    # 3. Create Student Profile
    print("\n3. Testing Profile Creation...")
    profile_data = {
        "name": "Test Student",
        "branch": "Computer Science & Engineering",
        "academic_year": "Third Year",
        "cgpa": 8.5,
        "skills": "Python, HTML, CSS, JavaScript, Git",
        "interests": "Machine Learning, Web Development",
        "career_goals": "Become an AI/ML Engineer",
        "certifications": "AWS Certified Cloud Practitioner"
    }
    response = client.post("/api/profile", json=profile_data, headers=headers)
    print(f"Status Code: {response.status_code}")
    assert response.status_code == 200, "Profile creation failed"
    profile_json = response.json()
    print(f"Profile saved. ATS Score: {profile_json['ats_score']}")
    
    # 4. Get Career Recommendations
    print("\n4. Testing Career Recommendations...")
    response = client.get("/api/careers/recommend", headers=headers)
    print(f"Status Code: {response.status_code}")
    assert response.status_code == 200, "Career recommendation failed"
    careers = response.json()
    print(f"Received {len(careers)} recommendations:")
    for c in careers:
        print(f" - {c['title']} (Demand: {c['demand_level']}, Score: {c['demand_score']})")
        
    target_career = careers[0]["title"]
    print(f"Selecting target career: {target_career}")

    # 5. Get Skill Gap Analysis
    print(f"\n5. Testing Skill Gap Analysis for: {target_career}...")
    gap_data = {"target_career": target_career}
    response = client.post("/api/careers/skill-gap", json=gap_data, headers=headers)
    print(f"Status Code: {response.status_code}")
    assert response.status_code == 200, "Skill gap analysis failed"
    gap = response.json()
    print(f"Missing skills count: {len(gap['missing_skills'])}")
    print(f"Strengths identified: {', '.join(gap['strengths'])}")

    # 6. Get Learning Roadmap
    print(f"\n6. Testing Roadmap Generation for: {target_career}...")
    roadmap_data = {"target_career": target_career}
    response = client.post("/api/careers/roadmap", json=roadmap_data, headers=headers)
    print(f"Status Code: {response.status_code}")
    assert response.status_code == 200, "Roadmap generation failed"
    roadmap = response.json()
    print("Roadmap generated:")
    print(f" - 30-Day Focus: {roadmap['plan_30_day']['focus']}")
    print(f" - 90-Day Focus: {roadmap['plan_90_day']['focus']}")
    print(f" - 180-Day Focus: {roadmap['plan_180_day']['focus']}")

    # 7. Check RAG Status
    print("\n7. Testing RAG Status...")
    response = client.get("/api/admin/rag/status")
    print(f"Status Code: {response.status_code}")
    assert response.status_code == 200
    print(f"RAG Details: {response.json()}")

    print("\n=== ALL BACKEND TESTS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    try:
        test_flow()
    except Exception as e:
        print(f"\n[ERROR] Test failed: {str(e)}")
        sys.exit(1)
