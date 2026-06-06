import React, { useState, useEffect } from "react";
import { api } from "../services/api";

export default function SkillGap({ profile, recommendations, targetCareer, setTargetCareer }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runGapAnalysis = async (role) => {
    if (!role) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.getSkillGap(role);
      setAnalysis(result);
    } catch (err) {
      setError(err.message || "Failed to retrieve skill gap details.");
    } finally {
      setLoading(false);
    }
  };

  // Run analysis when target career changes
  useEffect(() => {
    if (targetCareer && profile) {
      runGapAnalysis(targetCareer);
    }
  }, [targetCareer, profile]);

  const handleRoleChange = (e) => {
    const selected = e.target.value;
    setTargetCareer(selected);
  };

  const getPriorityColor = (priority) => {
    const p = priority?.toLowerCase() || "";
    if (p.includes("high")) return "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30";
    if (p.includes("medium")) return "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30";
    return "bg-slate-50 text-slate-600 dark:bg-slate-950/20 dark:text-slate-400 border-slate-200/50 dark:border-slate-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Skill Gap Analysis
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare your profile against industry standards for your selected goal.
          </p>
        </div>
        
        {/* Goal Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Target Goal:
          </label>
          <select
            value={targetCareer || ""}
            onChange={handleRoleChange}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:outline-none focus:border-primary-500"
          >
            <option value="" disabled>-- Select target career --</option>
            {recommendations && recommendations.length > 0 ? (
              recommendations.map((rec, idx) => (
                <option key={idx} value={rec.title}>
                  {rec.title}
                </option>
              ))
            ) : (
              <>
                <option value="AI/ML Engineer">AI/ML Engineer</option>
                <option value="Full-Stack Software Engineer">Full-Stack Software Engineer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Product Manager">Product Manager</option>
              </>
            )}
          </select>
        </div>
      </div>

      {!targetCareer ? (
        <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-4">
          <span className="text-5xl">🎯</span>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            No Career Goal Selected
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Please pick a career path from the Career Recommendations page or choose one from the selector above to trigger the skill gap analysis agent.
          </p>
        </div>
      ) : loading ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center space-y-3">
          <div className="animate-pulse text-5xl">🤖</div>
          <p className="text-sm font-bold text-slate-500">Skill Gap Agent analyzing details...</p>
          <p className="text-xs text-slate-400">Comparing your skills to RAG job guidelines</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-xs font-semibold">
          ⚠️ {error}
        </div>
      ) : analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Strengths & Current Skills (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Strengths Card */}
            <div className="glass-card p-5 border-emerald-100/30 dark:border-emerald-950/20 bg-gradient-to-br from-emerald-50/10 to-transparent">
              <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <span>💪</span>
                <span>Your Core Strengths</span>
              </h4>
              <ul className="space-y-3">
                {analysis.strengths && analysis.strengths.map((str, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{str}</span>
                  </li>
                ))}
                {(!analysis.strengths || analysis.strengths.length === 0) && (
                  <p className="text-xs text-slate-400">No specific strengths mapped yet.</p>
                )}
              </ul>
            </div>

            {/* Existing Skills Match */}
            <div className="glass-card p-5">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <span>✅</span>
                <span>Matched Skills</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.existing_skills && analysis.existing_skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/40 dark:border-emerald-900/30 rounded-xl text-xs font-bold"
                  >
                    {skill}
                  </span>
                ))}
                {(!analysis.existing_skills || analysis.existing_skills.length === 0) && (
                  <p className="text-xs text-slate-400">No overlapping skills matching this path.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Missing Skills list (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Skills Gaps & Targets for <span className="text-primary-500">{targetCareer}</span>
            </h3>

            <div className="space-y-4">
              {analysis.missing_skills && analysis.missing_skills.length > 0 ? (
                analysis.missing_skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="glass-card p-5 hover:border-indigo-100 dark:hover:border-indigo-950 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <h4 className="text-base font-bold text-slate-800 dark:text-white">
                        {skill.name}
                      </h4>
                      <div className="flex space-x-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase border rounded-md ${getPriorityColor(
                            skill.priority
                          )}`}
                        >
                          {skill.priority} Priority
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/30 rounded-md">
                          ⏳ {skill.estimated_effort}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed">
                      <span className="font-bold text-slate-400 mr-1.5">WHY NEEDED:</span>
                      {skill.reason}
                    </p>
                  </div>
                ))
              ) : (
                <div className="glass-card p-8 text-center text-slate-400">
                  🎉 No gaps identified! You have all the matching skills required for this career path.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
