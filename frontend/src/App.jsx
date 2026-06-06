import React, { useState, useEffect } from "react";
import { api } from "./services/api";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import LoginRegister from "./pages/LoginRegister";
import Dashboard from "./pages/Dashboard";
import CareerRecommendation from "./pages/CareerRecommendation";
import SkillGap from "./pages/SkillGap";
import Roadmap from "./pages/Roadmap";
import ResumeReview from "./pages/ResumeReview";
import AdminPanel from "./pages/AdminPanel";

export default function App() {
  // Global Session States
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [targetCareer, setTargetCareer] = useState(() => {
    return localStorage.getItem("careermate_target_career") || "";
  });

  // Navigation States
  const [authScreen, setAuthScreen] = useState("landing"); // "landing" or "auth"
  const [currentPage, setCurrentPage] = useState("dashboard"); // sidebar pages
  const [initializing, setInitializing] = useState(true);

  // Auto-authenticate and fetch profile on startup
  useEffect(() => {
    const initSession = async () => {
      const activeUser = api.getCurrentUser();
      const token = api.getToken();

      if (activeUser && token) {
        setUser(activeUser);
        try {
          // Fetch student profile details
          const profileData = await api.getProfile();
          setProfile(profileData);

          // Fetch career recommendations if they exist
          const recs = await api.getRecommendations();
          setRecommendations(recs);
        } catch (e) {
          console.warn("Session expired or profile not set up yet.");
        }
      }
      setInitializing(false);
    };
    initSession();
  }, []);

  const handleAuthSuccess = async (data) => {
    setUser({
      id: data.user_id,
      email: data.email,
      name: data.name,
      role: data.role,
    });
    setInitializing(true);
    try {
      const profileData = await api.getProfile();
      setProfile(profileData);
      
      const recs = await api.getRecommendations();
      setRecommendations(recs);
    } catch (e) {
      setProfile(null);
      setRecommendations([]);
    } finally {
      setInitializing(false);
      setCurrentPage("dashboard");
    }
  };

  const handleProfileUpdate = (updatedProfile, newRecs = null) => {
    setProfile(updatedProfile);
    if (newRecs) {
      setRecommendations(newRecs);
    }
  };

  const handleSelectTargetCareer = (careerTitle) => {
    setTargetCareer(careerTitle);
    localStorage.setItem("careermate_target_career", careerTitle);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Initializing CareerMate AI...
        </p>
      </div>
    );
  }

  // Auth Layout
  if (!user) {
    if (authScreen === "auth") {
      return (
        <LoginRegister
          onAuthSuccess={handleAuthSuccess}
          onBack={() => setAuthScreen("landing")}
        />
      );
    }
    return <Landing onGetStarted={() => setAuthScreen("auth")} />;
  }

  // Dashboard / App Layout
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Fixed Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        targetCareer={targetCareer}
      />

      {/* Main Content Area (pl-64 to shift past fixed sidebar) */}
      <div className="pl-64 flex flex-col min-h-screen">
        <Navbar user={user} />
        
        <main className="flex-1 p-8 overflow-y-auto max-w-5xl w-full mx-auto">
          {currentPage === "dashboard" && (
            <Dashboard
              profile={profile}
              recommendations={recommendations}
              setCurrentPage={setCurrentPage}
            />
          )}

          {currentPage === "profile" && (
            <CareerRecommendation
              profile={profile}
              recommendations={recommendations}
              onProfileUpdate={handleProfileUpdate}
              targetCareer={targetCareer}
              setTargetCareer={handleSelectTargetCareer}
            />
          )}

          {currentPage === "skillgap" && (
            <SkillGap
              profile={profile}
              recommendations={recommendations}
              targetCareer={targetCareer}
              setTargetCareer={handleSelectTargetCareer}
            />
          )}

          {currentPage === "roadmap" && (
            <Roadmap
              profile={profile}
              recommendations={recommendations}
              targetCareer={targetCareer}
              setTargetCareer={handleSelectTargetCareer}
            />
          )}

          {currentPage === "resume" && (
            <ResumeReview
              profile={profile}
              onProfileUpdate={handleProfileUpdate}
            />
          )}

          {currentPage === "rag" && <AdminPanel />}
        </main>
      </div>
    </div>
  );
}
