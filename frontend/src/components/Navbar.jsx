import React from "react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar({ user }) {
  // Get time-based greeting
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good morning";
    if (hrs < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10 text-slate-800 dark:text-slate-200">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {getGreeting()}, <span className="text-slate-800 dark:text-white font-extrabold">{user?.name || "Student"}</span>
        </span>
      </div>
      <div className="flex items-center space-x-4">
        {/* Model Indicator badge */}
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-100/50 dark:border-primary-900/30">
          🤖 Granite 13B (Watsonx)
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
