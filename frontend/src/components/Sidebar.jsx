import React from "react";
import { api } from "../services/api";

export default function Sidebar({ currentPage, setCurrentPage, user, targetCareer }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "profile", label: "Profile & Career Matches", icon: "👤" },
    { id: "skillgap", label: "Skill Gap Analysis", icon: "⚖️" },
    { id: "roadmap", label: "Learning Roadmap", icon: "🗺️" },
    { id: "resume", label: "Resume & ATS Review", icon: "📄" },
    { id: "rag", label: "RAG Explorer", icon: "🔍" },
  ];

  const handleLogout = () => {
    api.logout();
    window.location.reload();
  };

  // Extract initials
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "ST";

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen fixed left-0 top-0 text-slate-800 dark:text-slate-200 transition-all z-20">
      {/* Brand Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-3">
        <span className="text-2xl">🎓</span>
        <div>
          <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-primary-500 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 bg-clip-text text-transparent">
            CareerMate AI
          </h1>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
            AGENTIC COMPANION
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${
              currentPage === item.id
                ? "bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400 shadow-sm shadow-primary-500/5"
                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Profile summary / footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
        {targetCareer && (
          <div className="mb-3 px-2 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30">
            <span className="text-[10px] text-indigo-500 font-bold block uppercase tracking-wider">
              Goal Role
            </span>
            <span className="text-xs text-slate-700 dark:text-indigo-300 font-semibold truncate block">
              {targetCareer}
            </span>
          </div>
        )}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary-500/10">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-slate-700 dark:text-slate-300">
              {user?.name || "Student"}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 w-full py-2 px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors flex items-center justify-center space-x-1.5"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
