import React, { useState, useEffect } from "react";
import { api } from "../services/api";

export default function Roadmap({ profile, recommendations, targetCareer, setTargetCareer }) {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("30"); // "30", "90", or "180"
  
  // Track checkmarks for topics locally to give user interaction
  const [checkedTopics, setCheckedTopics] = useState({});

  const fetchRoadmap = async (role) => {
    if (!role) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.getRoadmap(role);
      setRoadmap(result);
      // Initialize checkboxes
      const checks = {};
      ["plan_30_day", "plan_90_day", "plan_180_day"].forEach((planKey) => {
        if (result[planKey]?.topics) {
          result[planKey].topics.forEach((topic) => {
            checks[topic] = false;
          });
        }
      });
      setCheckedTopics(checks);
    } catch (err) {
      setError(err.message || "Failed to retrieve study roadmap.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetCareer && profile) {
      fetchRoadmap(targetCareer);
    }
  }, [targetCareer, profile]);

  const handleRoleChange = (e) => {
    const selected = e.target.value;
    setTargetCareer(selected);
  };

  const toggleTopic = (topic) => {
    setCheckedTopics((prev) => ({
      ...prev,
      [topic]: !prev[topic],
    }));
  };

  const getActivePlan = () => {
    if (!roadmap) return null;
    if (activeTab === "30") return roadmap.plan_30_day;
    if (activeTab === "90") return roadmap.plan_90_day;
    return roadmap.plan_180_day;
  };

  const activePlan = getActivePlan();

  // Calculate progress percent for active tab
  const getProgressPercent = () => {
    if (!activePlan?.topics || activePlan.topics.length === 0) return 0;
    const checkedCount = activePlan.topics.filter(t => checkedTopics[t]).length;
    return Math.round((checkedCount / activePlan.topics.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Learning Roadmap
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Follow a structured 30-90-180 day timeline to bridge your technical skill gaps.
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
          <span className="text-5xl">🗺️</span>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            No Career Goal Selected
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Please pick a career path from the Career Recommendations page or choose one from the selector above to generate your study roadmaps.
          </p>
        </div>
      ) : loading ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center space-y-3">
          <div className="animate-pulse text-5xl">🤖</div>
          <p className="text-sm font-bold text-slate-500">Roadmap Agent designing study plan...</p>
          <p className="text-xs text-slate-400">Structuring courses, topics, and practical projects</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-2xl text-xs font-semibold">
          ⚠️ {error}
        </div>
      ) : roadmap ? (
        <div className="space-y-6">
          {/* Phase Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            {[
              { id: "30", label: "30 Days Plan", sub: "Core Tooling" },
              { id: "90", label: "90 Days Plan", sub: "Cloud & Scaling" },
              { id: "180", label: "180 Days Plan", sub: "System Design" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 pb-4 pt-2 border-b-2 text-center transition-all ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600 dark:text-primary-400 font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-semibold"
                }`}
              >
                <span className="block text-sm sm:text-base">{tab.label}</span>
                <span className="text-[10px] uppercase tracking-wide opacity-80 font-bold block mt-0.5 sm:inline-block sm:ml-1">
                  ({tab.sub})
                </span>
              </button>
            ))}
          </div>

          {activePlan && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Side: Progress & Checklist (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Checklist Card */}
                <div className="glass-card p-6">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                        Topic Checklist
                      </h3>
                      <p className="text-xs text-slate-400">Mark off subjects as you master them.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-primary-500">{getProgressPercent()}%</span>
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Done</span>
                    </div>
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-3">
                    {activePlan.topics && activePlan.topics.map((topic, idx) => {
                      const isChecked = checkedTopics[topic] || false;
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleTopic(topic)}
                          className={`p-3.5 border rounded-2xl cursor-pointer flex items-center space-x-3 transition-all ${
                            isChecked
                              ? "bg-emerald-50/20 border-emerald-500/50 dark:border-emerald-900/40 text-slate-500 dark:text-slate-400 line-through"
                              : "bg-slate-50/40 border-slate-200/50 dark:bg-slate-950/20 dark:border-slate-800 hover:border-primary-500/40"
                          }`}
                        >
                          <span className={`w-5 h-5 flex items-center justify-center rounded-md border text-xs font-bold ${
                            isChecked 
                              ? "bg-emerald-500 border-emerald-500 text-white" 
                              : "border-slate-300 dark:border-slate-700"
                          }`}>
                            {isChecked && "✓"}
                          </span>
                          <span className="text-xs font-semibold select-none flex-1">
                            {topic}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Side: Courses & Projects (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Courses Card */}
                <div className="glass-card p-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center space-x-2">
                    <span>📚</span>
                    <span>Recommended Classes</span>
                  </h3>
                  <div className="space-y-3">
                    {activePlan.courses && activePlan.courses.map((course, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/80 rounded-xl flex justify-between items-center"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {course.name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            {course.provider}
                          </span>
                        </div>
                        <span className="text-xs bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 border border-primary-100/50 dark:border-primary-900/30 px-2 py-0.5 rounded font-bold whitespace-nowrap">
                          Enroll
                        </span>
                      </div>
                    ))}
                    {(!activePlan.courses || activePlan.courses.length === 0) && (
                      <p className="text-xs text-slate-400 text-center py-2">
                        No courses suggested for this phase.
                      </p>
                    )}
                  </div>
                </div>

                {/* Projects Card */}
                <div className="glass-card p-6 border-indigo-100/30 dark:border-indigo-950/20 bg-gradient-to-br from-indigo-50/10 to-transparent">
                  <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-4 flex items-center space-x-2">
                    <span>💻</span>
                    <span>Practical Lab Project</span>
                  </h3>
                  <div className="space-y-3">
                    {activePlan.projects && activePlan.projects.map((proj, idx) => (
                      <div key={idx} className="p-3.5 bg-white/60 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/50 rounded-xl">
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                          {proj}
                        </p>
                      </div>
                    ))}
                    {(!activePlan.projects || activePlan.projects.length === 0) && (
                      <p className="text-xs text-slate-400 text-center py-2">
                        No projects suggested for this phase.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
