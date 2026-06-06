import React from "react";

export default function ProgressCircle({ value, size = 120, strokeWidth = 10, label = "", colorClass = "text-primary-500" }) {
  const percentage = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          {/* Background Ring */}
          <circle
            className="text-slate-100 dark:text-slate-800"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Active Ring */}
          <circle
            className={`${colorClass} transition-all duration-1000 ease-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            {percentage}
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
            Score
          </span>
        </div>
      </div>
      {label && (
        <span className="mt-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </span>
      )}
    </div>
  );
}
