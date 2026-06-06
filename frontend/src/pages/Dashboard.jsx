import React from "react";
import ProgressCircle from "../components/ProgressCircle";
import StatsChart from "../components/StatsChart";

export default function Dashboard({ profile, recommendations, setCurrentPage }) {
  // Safe parsing of ATS feedback
  let atsFeedback = { weak_sections: [], missing_skills: [], suggestions: [] };
  if (profile?.ats_feedback) {
    try {
      atsFeedback = JSON.parse(profile.ats_feedback);
    } catch (e) {
      console.error("Error parsing ATS feedback JSON", e);
    }
  }

  // Calculate profile completion percentage
  let profileCompletion = 20; // base registered state
  if (profile?.name) profileCompletion += 10;
  if (profile?.branch) profileCompletion += 15;
  if (profile?.cgpa) profileCompletion += 15;
  if (profile?.skills) profileCompletion += 20;
  if (profile?.interests) profileCompletion += 10;
  if (profile?.resume_filename) profileCompletion += 10;

  // Compile skills list for chart
  const skillsList = profile?.skills
    ? profile.skills.split(",").map((s) => s.trim())
    : [];

  const chartData = skillsList.slice(0, 5).map((skill, index) => {
    // Generate realistic placeholder progress bars based on alphabetical or index values
    const seedVal = (skill.charCodeAt(0) * 7 + index * 13) % 40 + 55;
    return { label: skill, value: seedVal };
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Student Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your ATS readiness, career recommendations, and roadmap milestones.
          </p>
        </div>
        <div className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold text-slate-500 dark:text-slate-400">
          📆 Academic Year: <span className="text-primary-500">{profile?.academic_year || "Setup Required"}</span>
        </div>
      </div>

      {!profile ? (
        /* Empty State Callout */
        <div className="glass-card p-8 text-center max-w-xl mx-auto space-y-4">
          <span className="text-5xl">👋</span>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Welcome to CareerMate AI!
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            To unlock career recommendations, skill-gap analysis, and customized roadmaps, please complete your student profile and upload your resume.
          </p>
          <button
            onClick={() => setCurrentPage("profile")}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5"
          >
            Create Your Profile
          </button>
        </div>
      ) : (
        /* Full Dashboard Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left/Middle Column (Gauges and Charts) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-5 flex items-center space-x-4">
                <span className="text-3xl">🎯</span>
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block">
                    CGPA
                  </span>
                  <span className="text-xl font-extrabold text-slate-800 dark:text-slate-200">
                    {profile.cgpa} / 10
                  </span>
                </div>
              </div>
              <div className="glass-card p-5 flex items-center space-x-4">
                <span className="text-3xl">🛠️</span>
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block">
                    Skills Added
                  </span>
                  <span className="text-xl font-extrabold text-slate-800 dark:text-slate-200">
                    {skillsList.length}
                  </span>
                </div>
              </div>
              <div className="glass-card p-5 flex items-center space-x-4">
                <span className="text-3xl">🎖️</span>
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block">
                    Matches
                  </span>
                  <span className="text-xl font-extrabold text-slate-800 dark:text-slate-200">
                    {recommendations?.length || 0} Paths
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Charts / Rings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Completion and ATS Gauge */}
              <div className="glass-card p-6 flex flex-col items-center justify-center space-y-6 md:space-y-0 md:flex-row md:space-x-8">
                <ProgressCircle
                  value={profile.ats_score}
                  size={120}
                  label="ATS Score"
                  colorClass={profile.ats_score >= 70 ? "text-emerald-500" : "text-amber-500"}
                />
                <ProgressCircle
                  value={profileCompletion}
                  size={120}
                  label="Profile Completion"
                  colorClass="text-indigo-500"
                />
              </div>

              {/* Skills Progress Chart */}
              <StatsChart title="Top Skills Strength" data={chartData} />
            </div>

            {/* Quick Action Navigation Grid */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                Quick Action Companion
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button
                  onClick={() => setCurrentPage("profile")}
                  className="p-4 bg-slate-50 dark:bg-slate-950 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-center rounded-2xl border border-slate-200/50 dark:border-slate-800/60 transition-all group"
                >
                  <span className="text-2xl block mb-2">👤</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary-500">
                    Edit Profile
                  </span>
                </button>
                <button
                  onClick={() => setCurrentPage("resume")}
                  className="p-4 bg-slate-50 dark:bg-slate-950 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-center rounded-2xl border border-slate-200/50 dark:border-slate-800/60 transition-all group"
                >
                  <span className="text-2xl block mb-2">📄</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary-500">
                    ATS Feedback
                  </span>
                </button>
                <button
                  onClick={() => setCurrentPage("skillgap")}
                  className="p-4 bg-slate-50 dark:bg-slate-950 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-center rounded-2xl border border-slate-200/50 dark:border-slate-800/60 transition-all group"
                >
                  <span className="text-2xl block mb-2">⚖️</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary-500">
                    Analyze Gaps
                  </span>
                </button>
                <button
                  onClick={() => setCurrentPage("roadmap")}
                  className="p-4 bg-slate-50 dark:bg-slate-950 hover:bg-primary-50 dark:hover:bg-primary-950/20 text-center rounded-2xl border border-slate-200/50 dark:border-slate-800/60 transition-all group"
                >
                  <span className="text-2xl block mb-2">🗺️</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary-500">
                    Study Roadmap
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (AI Advisor Insights) */}
          <div className="space-y-6">
            <div className="glass-card p-6 bg-gradient-to-br from-indigo-50/50 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 border-indigo-100/50 dark:border-indigo-950/40">
              <div className="flex items-center space-x-2.5 mb-4">
                <span className="text-2xl">🤖</span>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  AI Companion Insights
                </h3>
              </div>
              
              <div className="space-y-4">
                {/* Resume Status */}
                {profile.resume_filename ? (
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-100/50 dark:border-emerald-900/30 rounded-xl text-xs flex items-center space-x-2">
                    <span className="text-lg">✅</span>
                    <span className="text-slate-600 dark:text-emerald-400 font-medium truncate">
                      Resume active: {profile.resume_filename}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/15 border border-amber-100/50 dark:border-amber-900/30 rounded-xl text-xs flex items-center space-x-2">
                    <span className="text-lg">⚠️</span>
                    <span className="text-slate-600 dark:text-amber-400 font-medium">
                      No resume uploaded for ATS scoring.
                    </span>
                  </div>
                )}

                {/* Suggestions List */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Priority Suggestions
                  </h4>
                  {atsFeedback.suggestions && atsFeedback.suggestions.length > 0 ? (
                    <ul className="space-y-2">
                      {atsFeedback.suggestions.slice(0, 3).map((sug, idx) => (
                        <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-1.5">
                          <span className="text-primary-500 mt-0.5">•</span>
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Profile details are basic. Upload your resume or fill out skills to receive specific recommendations.
                    </p>
                  )}
                </div>

                {/* Missing Skills list */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Identified Skill Gaps
                  </h4>
                  {atsFeedback.missing_skills && atsFeedback.missing_skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {atsFeedback.missing_skills.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-bold border border-slate-200/50 dark:border-slate-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      No skill gaps analyzed yet. Please select a target career.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
