import React, { useState } from "react";
import { api } from "../services/api";
import ProgressCircle from "../components/ProgressCircle";

export default function ResumeReview({ profile, onProfileUpdate }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.type !== "application/pdf") {
        setError("Only PDF files are supported for resume upload.");
        setFile(null);
        return;
      }
      setFile(selected);
      setError("");
      setSuccess("");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await api.uploadResume(file);
      onProfileUpdate(result.profile);
      setSuccess("Resume parsed and ATS score updated successfully!");
      setFile(null);
    } catch (err) {
      setError(err.message || "Failed to process resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Safe parsing of ATS feedback
  let atsFeedback = { weak_sections: [], missing_skills: [], suggestions: [] };
  if (profile?.ats_feedback) {
    try {
      atsFeedback = JSON.parse(profile.ats_feedback);
    } catch (e) {
      console.error("Error parsing ATS feedback JSON", e);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Resume & ATS Review
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload your resume in PDF format to receive instant ATS score analysis and modular recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Box (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center space-x-2">
              <span>📤</span>
              <span>Upload Resume PDF</span>
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-semibold">
                ✅ {success}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary-500 rounded-3xl p-8 text-center transition-colors relative cursor-pointer group">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading}
                />
                <div className="space-y-3">
                  <span className="text-4xl block group-hover:scale-110 transition-transform">📄</span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {file ? file.name : "Select Resume File"}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Supports PDF files up to 5MB"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !file}
                className={`w-full py-3 font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 text-sm ${
                  !file
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default shadow-none"
                    : "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/15"
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Parsing Resume...</span>
                  </>
                ) : (
                  <span>Process Resume</span>
                )}
              </button>
            </form>
          </div>

          {profile?.resume_filename && (
            <div className="glass-card p-5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Active Resume Document
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">📄</span>
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[200px]">
                    {profile.resume_filename}
                  </span>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">
                  Active
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: ATS Report Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!profile ? (
            <div className="glass-card p-12 text-center text-slate-400">
              <span className="text-4xl block mb-2">📋</span>
              <p className="text-sm font-semibold">No profile created yet.</p>
              <p className="text-xs">Create an Academic Profile first to enable reports.</p>
            </div>
          ) : !profile.resume_filename ? (
            <div className="glass-card p-12 text-center text-slate-400">
              <span className="text-4xl block mb-2">📥</span>
              <p className="text-sm font-semibold">No Resume PDF Uploaded.</p>
              <p className="text-xs">Upload your resume on the left to compute your ATS compatibility report.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score summary panel */}
              <div className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-primary-50/10 to-indigo-50/10 dark:from-primary-950/10 dark:to-indigo-950/10">
                <div className="space-y-1.5 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    ATS Compatibility Grade
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    This score is calculated by the Profile Agent scanning structure, missing keywords, and readability benchmarks.
                  </p>
                </div>
                <ProgressCircle
                  value={profile.ats_score}
                  size={110}
                  colorClass={profile.ats_score >= 75 ? "text-emerald-500" : "text-amber-500"}
                />
              </div>

              {/* Weak sections grid */}
              <div className="glass-card p-5 border-rose-100/30 dark:border-rose-950/20 bg-gradient-to-br from-rose-50/5 to-transparent">
                <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-3 flex items-center space-x-2">
                  <span>❌</span>
                  <span>Weak / Flagged Sections</span>
                </h4>
                <ul className="space-y-2">
                  {atsFeedback.weak_sections && atsFeedback.weak_sections.map((weak, idx) => (
                    <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-2">
                      <span className="text-rose-500 mt-0.5">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                  {(!atsFeedback.weak_sections || atsFeedback.weak_sections.length === 0) && (
                    <p className="text-xs text-slate-400">No major weaknesses flagged in this resume.</p>
                  )}
                </ul>
              </div>

              {/* Suggestions grid */}
              <div className="glass-card p-5 border-indigo-100/30 dark:border-indigo-950/20 bg-gradient-to-br from-indigo-50/5 to-transparent">
                <h4 className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-3 flex items-center space-x-2">
                  <span>💡</span>
                  <span>ATS Improvement Actions</span>
                </h4>
                <ul className="space-y-2.5">
                  {atsFeedback.suggestions && atsFeedback.suggestions.map((sug, idx) => (
                    <li key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-2">
                      <span className="text-primary-500 mt-0.5">✓</span>
                      <span>{sug}</span>
                    </li>
                  ))}
                  {(!atsFeedback.suggestions || atsFeedback.suggestions.length === 0) && (
                    <p className="text-xs text-slate-400">No recommendations generated.</p>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
