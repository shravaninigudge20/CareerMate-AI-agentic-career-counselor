import React, { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("careermate_theme") === "dark" || 
      (!("careermate_theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
      localStorage.setItem("careermate_theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("careermate_theme", "light");
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
      aria-label="Toggle Theme"
    >
      {darkMode ? (
        <span className="text-amber-500">☀️</span>
      ) : (
        <span className="text-indigo-600">🌙</span>
      )}
    </button>
  );
}
