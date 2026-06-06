<<<<<<< HEAD
# CareerMate AI – Agentic Career Counseling Companion

CareerMate AI is a full-stack, AI-powered web application designed to guide students in choosing and preparing for the right career path. The application leverages multiple specialized AI agents orchestrated by a central coordinator, utilizing IBM Granite models via Watsonx.ai (with high-fidelity simulator fallbacks). It incorporates a RAG (Retrieval-Augmented Generation) knowledge base stored in ChromaDB to retrieve career frameworks, roadmaps, and industry trends.

---

## 🎯 Core Features

1. **Student Profile Analyzer:** Parses profile details and reviews resume PDFs for ATS compatibility and scores.
2. **Career Recommendation Agent:** Evaluates profile data and suggests 3-4 suitable career paths.
3. **Skill Gap Agent:** Compares current skills side-by-side with requirements of the target career.
4. **Learning Roadmap Generator:** Constructs step-by-step 30-day, 90-day, and 180-day plans with certifications and projects.
5. **RAG Knowledge Base:** Indexes guides, trends, and technologies in ChromaDB for semantic context search.
6. **Student Dashboard:** Visualizes scores, skill progress, goal trackers, and suggestions in a sleek layout.

---

## 📂 Project Structure

```text
careermate-ai/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── coordinator.py     # Central Coordinator Agent
│   │   │   ├── profile_agent.py   # Parses profile & evaluates resume ATS
│   │   │   ├── career_agent.py    # Generates matches using profile & RAG
│   │   │   ├── skill_gap_agent.py # Mapped side-by-side comparison
│   │   │   └── roadmap_agent.py   # Renders 30/90/180 days roadmaps
│   │   ├── services/
│   │   │   ├── watsonx.py         # IBM Watsonx/Granite connector & Simulator
│   │   │   └── rag.py             # ChromaDB vector index and seeding
│   │   ├── auth.py                # Bcrypt & JWT security utilities
│   │   ├── database.py            # SQLite connection setup
│   │   ├── models.py              # SQLAlchemy DB Tables
│   │   ├── schemas.py             # Pydantic validation schemas
│   │   ├── main.py                # FastAPI endpoints & CORS configuration
│   │   ├── uploads/               # Temporary uploads folder
│   │   └── data/                  # SQLite & ChromaDB files (Created at startup)
│   ├── verify_api.py              # Automated backend test suite
│   ├── .env                       # Environment variables
│   └── requirements.txt           # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx        # Navigation sidebar
│   │   │   ├── Navbar.jsx         # Section header
│   │   │   ├── ThemeToggle.jsx    # Dark/Light mode switcher
│   │   │   ├── ProgressCircle.jsx # Circular SVG gauges
│   │   │   └── StatsChart.jsx     # Custom SVG horizontal bar charts
│   │   ├── pages/
│   │   │   ├── Landing.jsx        # Hero page
│   │   │   ├── LoginRegister.jsx  # Sign-in / Sign-up form
│   │   │   ├── Dashboard.jsx      # Metrics overview
│   │   │   ├── CareerRecommendation.jsx # Profile form & matching paths
│   │   │   ├── SkillGap.jsx       # Gap priorities table
│   │   │   ├── Roadmap.jsx        # Step-by-step progress checklist
│   │   │   └── AdminPanel.jsx     # RAG database vector explorer
│   │   ├── services/
│   │   │   └── api.js             # Fetch wrapper with JWT headers
│   │   ├── App.jsx                # Session router
│   │   ├── index.css              # Custom Tailwind theme
│   │   └── main.jsx               # Entrypoint
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md                      # Documentation
```

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS, Vite
- **Backend:** FastAPI (Python), REST APIs
- **Database:** SQLite (SQLAlchemy)
- **Vector Database:** ChromaDB
- **AI Stack:** IBM Granite LLM (via Watsonx.ai and high-fidelity local simulator)

---

## 🚀 Setup & Execution

### 1. Backend Setup

1. Open a terminal and navigate to the `backend/` folder:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux:**
     ```bash
     python -m venv venv
     source venv/bin/activate
     ```

3. Install requirements:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables in `.env`:
   - Fill out `WATSONX_API_KEY` and `WATSONX_PROJECT_ID` to connect to live IBM Granite models.
   - If left empty, the application runs on a **high-fidelity local simulator** that mocks responses from the agents in perfect JSON structure, making it fully testable offline.

5. Run the API server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The API will be available at `http://localhost:8000`. You can inspect the Swagger documentation at `http://localhost:8000/docs`.

### 2. Run Backend Tests

To run the automated in-memory FastAPI integration test suite:
```bash
python verify_api.py
```
If successful, you will see `=== ALL BACKEND TESTS PASSED SUCCESSFULLY ===`.

### 3. Frontend Setup

1. Open a new terminal and navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your web browser.

---

## 🤖 IBM Watsonx.ai Integration details

The Watsonx integration is managed in `backend/app/services/watsonx.py`.
It queries the generation endpoint:
`https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2024-05-01`
And the embedding endpoint:
`https://us-south.ml.cloud.ibm.com/ml/v1/text/embeddings?version=2024-05-31`
It automatically handles fetching and refreshing the IBM Cloud IAM oauth token:
`https://iam.cloud.ibm.com/identity/token`

---

## 🎓 Showcase Walkthrough

1. **Register & Log In:** Create a new student profile.
2. **Complete Profile:** Input branch, CGPA, and interests to seed the RAG database search.
3. **Upload Resume:** Select a `.pdf` file to receive an ATS rating (e.g. 78/100) and flagged suggestions.
4. **Inspect Recommendations:** Review recommended careers matched to your profile by the IBM Granite Agent.
5. **Select Goal:** Select a career path as your primary target goal (e.g. "AI/ML Engineer").
6. **Inspect Gaps:** Go to the Skill Gap page to see a side-by-side list of matched vs missing skills, priority levels, and effort estimates.
7. **Study Roadmap:** Open the Roadmap page to view a 30-90-180 day timeline. Check off topics as you study them!
8. **Explore RAG Database:** Open the RAG Explorer page to query the underlying vector index and examine the career guidelines stored in ChromaDB.
=======
# CareerMate-AI-agentic-career-counselor
>>>>>>> 15be881d7d7e9e139d60ab7993b90781833c6837
