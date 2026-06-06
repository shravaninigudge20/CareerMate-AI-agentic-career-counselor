import React from "react";

export default function StatsChart({ title, data = [] }) {
  // Expected data: [{ label: "React", value: 80 }, { label: "Python", value: 65 }]
  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
        {title}
      </h3>
      <div className="space-y-4">
        {data.map((item, idx) => {
          const val = Math.min(Math.max(item.value, 0), 100);
          return (
            <div key={idx} className="group">
              <div className="flex justify-between text-sm font-semibold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300 group-hover:text-primary-500 transition-colors">
                  {item.label}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {val}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">
            No chart data available.
          </p>
        )}
      </div>
    </div>
  );
}
