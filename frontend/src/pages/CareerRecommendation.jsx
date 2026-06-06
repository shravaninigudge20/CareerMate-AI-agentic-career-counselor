import React, { useState, useEffect } from "react";
import { api } from "../services/api";

export default function CareerRecommendation({ profile, recommendations, onProfileUpdate, targetCareer, setTargetCareer }) {
  // Form States
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("Computer Science & Engineering");
  const [academicYear, setAcademicYear] = useState("Third Year");
  const [cgpa, setCgpa] = useState("8.0");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [careerGoals, setCareerGoals] = useState("");
  const [certifications, setCertifications] = useState("");

  const [loading, setLoading] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Seed form from existing profile on load
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setBranch(profile.branch || "Computer Science & Engineering");
      setAcademicYear(profile.academic_year || "Third Year");
      setCgpa(profile.cgpa?.toString() || "8.0");
      setSkills(profile.skills || "");
      setInterests(profile.interests || "");
      setCareerGoals(profile.career_goals || "");
      setCertifications(profile.certifications || "");
    }
  }, [profile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const savedProfile = await api.saveProfile({
        name,
        branch,
        academic_year: academicYear,
        cgpa: parseFloat(cgpa),
        skills,
        interests,
        career_goals: careerGoals,
        certifications,
      });
      onProfileUpdate(savedProfile);
      setMessage("Profile saved successfully! Running agent recommendations...");
      
      // Immediately run matching agent
      setMatchLoading(true);
      const matches = await api.getRecommendations();
      onProfileUpdate(savedProfile, matches);
      setMessage("Profile updated and new career recommendations generated!");
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
      setMatchLoading(false);
    }
  };

  const getDemandColor = (level) => {
    const lvl = level?.toLowerCase() || "";
    if (lvl.includes("critical")) return "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30";
    if (lvl.includes("high")) return "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30";
    return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Career Recommendations
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Complete your academic profile details and let the Career Matching Agent suggest appropriate paths.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Profile Form (5 cols) */}
        <div className="lg:col-span-5">
          <div className="glass-card p-6">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-2">
              <span>👤</span>
              <span>Academic Profile</span>
            </h3>

            {message && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-semibold">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Branch / Major
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-primary-500 text-sm"
                  >
                    <option>Computer Science & Engineering</option>
                    <option>Information Technology</option>
                    <option>Electronics & Communication</option>
                    <option>Electrical Engineering</option>
                    <option>Mechanical Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Academic Year
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-primary-500 text-sm"
                  >
                    <option>First Year</option>
                    <option>Second Year</option>
                    <option>Third Year</option>
                    <option>Final Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  CGPA (Scale 0.0 - 10.0)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  required
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Skills (Comma separated)
                </label>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Python, Java, HTML, Git, SQL"
                  rows="2"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Interests (Comma separated)
                </label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. machine learning, app development, finance"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Career Goals
                </label>
                <input
                  type="text"
                  value={careerGoals}
                  onChange={(e) => setCareerGoals(e.target.value)}
                  placeholder="e.g. Become a Senior ML Engineer or Cloud Solutions Architect"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Certifications (Comma separated)
                </label>
                <input
                  type="text"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="e.g. AWS Certified Practitioner, Google IT Support"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-primary-500 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading || matchLoading}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 text-sm"
              >
                {loading || matchLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Running Agents...</span>
                  </>
                ) : (
                  <span>Save Profile & Analyze</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Recommended Paths (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <span>🎯</span>
              <span>Recommended Career Paths</span>
            </h3>
            {recommendations && recommendations.length > 0 && (
              <span className="text-xs text-slate-400 font-semibold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                IBM Granite Matches
              </span>
            )}
          </div>

          {matchLoading ? (
            <div className="glass-card p-12 flex flex-col items-center justify-center space-y-3">
              <div className="animate-pulse text-5xl">🤖</div>
              <p className="text-sm font-bold text-slate-500">Agentic matches calculations in progress...</p>
              <p className="text-xs text-slate-400">Comparing profile parameters against technology RAG guidelines</p>
            </div>
          ) : recommendations && recommendations.length > 0 ? (
            <div className="space-y-4">
              {recommendations.map((path, idx) => {
                const isSelectedGoal = targetCareer === path.title;
                return (
                  <div
                    key={idx}
                    className={`glass-card p-5 border transition-all ${
                      isSelectedGoal
                        ? "border-primary-500 bg-primary-50/10 dark:border-primary-500/60 dark:bg-primary-950/15"
                        : "border-slate-200/50 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                          <span>{path.title}</span>
                          {isSelectedGoal && (
                            <span className="text-xs bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-md font-bold">
                              TARGET GOAL
                            </span>
                          )}
                        </h4>
                        <span className="text-xs text-slate-400 font-semibold block mt-0.5">
                          💼 Average Salary: <span className="text-slate-700 dark:text-slate-300 font-bold">{path.salary_range}</span>
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg border ${getDemandColor(
                          path.demand_level
                        )}`}
                      >
                        {path.demand_level}
                      </span>
                    </div>

                    <div className="mt-3.5 space-y-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Counselor Reasoning
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                          {path.reasoning}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Future Growth & Trends
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                          {path.future_opportunities}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setTargetCareer(path.title)}
                        disabled={isSelectedGoal}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                          isSelectedGoal
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default"
                            : "bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/15"
                        }`}
                      >
                        {isSelectedGoal ? "Selected Target" : "Select as Career Goal"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card p-12 text-center text-slate-400 space-y-2">
              <span className="text-4xl block">🔍</span>
              <p className="text-sm font-semibold">No career suggestions loaded.</p>
              <p className="text-xs">Submit the Academic Profile form to prompt the matching agent.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
