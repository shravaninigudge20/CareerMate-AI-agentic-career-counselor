import React from "react";

export default function Landing({ onGetStarted }) {
  const features = [
    {
      title: "Student Profile Analyzer",
      description: "Extracts metadata from profile fields and reviews resumes for ATS compatibility, showing score gaps.",
      icon: "🔍"
    },
    {
      title: "Career Recommendation Agent",
      description: "Leverages IBM Granite and ChromaDB RAG to match student profiles with high-demand job categories.",
      icon: "🎯"
    },
    {
      title: "Skill Gap Analysis Agent",
      description: "Compares current skills side-by-side with requirements of the target career, detailing missing competencies.",
      icon: "⚖️"
    },
    {
      title: "Learning Roadmap Generator",
      description: "Generates custom 30-day, 90-day, and 180-day step-by-step roadmaps with course recommendations.",
      icon: "🗺️"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
          <span className="text-3xl">🎓</span>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary-500 to-indigo-600 dark:from-primary-400 dark:to-indigo-400 bg-clip-text text-transparent">
            CareerMate AI
          </span>
        </div>
        <button
          onClick={onGetStarted}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/20 transition-all hover:-translate-y-0.5 text-sm"
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-12 max-w-5xl mx-auto text-center relative overflow-hidden">
        {/* Decorative Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/10 dark:bg-primary-500/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 tracking-wide uppercase">
            ⚡ Agentic Career Counseling Companion
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
            Chart Your Career Path with{" "}
            <span className="bg-gradient-to-r from-primary-500 via-indigo-500 to-indigo-600 dark:from-primary-400 dark:via-indigo-400 dark:to-indigo-500 bg-clip-text text-transparent">
              Agentic AI
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload your resume, analyze your skills, and let our multi-agent AI system design custom learning roadmaps, calculate ATS scores, and guide you to your dream job.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-500 to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/20 hover:shadow-primary-500/35 transition-all hover:-translate-y-0.5 text-base"
            >
              Get Started Free
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 font-semibold rounded-2xl transition-all text-base text-slate-600 dark:text-slate-300"
            >
              Learn More
            </a>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="max-w-6xl mx-auto w-full px-6 py-16 border-t border-slate-100 dark:border-slate-900">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Powered by IBM Granite
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
            A state-of-the-art multi-agent system collaborating to deliver precise career advice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feat, idx) => (
            <div key={idx} className="glass-card p-6 flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center text-2xl shadow-sm">
                {feat.icon}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-100 dark:border-slate-900">
        <p>© 2026 CareerMate AI Companion. All rights reserved. Powered by Watsonx.ai.</p>
      </footer>
    </div>
  );
}
