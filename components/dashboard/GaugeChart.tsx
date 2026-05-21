"use client";

import { useMemo } from "react";

/**
 * Semicircle gauge — ชมพู = achieved, เทา = remaining
 */
export default function GaugeChart({
  percent,
  label = "% Achieved",
}: {
  percent: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));

  const { dashAchieved, dashRemaining } = useMemo(() => {
    const circumference = Math.PI * 90;
    const achieved = (clamped / 100) * circumference;
    return {
      dashAchieved: `${achieved} ${circumference}`,
      dashRemaining: `${circumference - achieved} ${circumference}`,
    };
  }, [clamped]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg viewBox="0 0 220 130" className="w-full">
        <defs>
          <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E91E8C" />
            <stop offset="100%" stopColor="#FF6B35" />
          </linearGradient>
        </defs>

        {/* track (remaining) */}
        <path
          d="M 20 110 A 90 90 0 0 1 200 110"
          fill="none"
          stroke="#F1F1F4"
          strokeWidth="22"
          strokeLinecap="round"
        />

        {/* achieved */}
        <path
          d="M 20 110 A 90 90 0 0 1 200 110"
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth="22"
          strokeLinecap="round"
          strokeDasharray={dashAchieved}
        />

        <text
          x="110"
          y="95"
          textAnchor="middle"
          className="font-kanit"
          fontSize="32"
          fontWeight="700"
          fill="#1a1a2e"
        >
          {clamped.toFixed(1)}%
        </text>
        <text
          x="110"
          y="118"
          textAnchor="middle"
          className="font-kanit"
          fontSize="11"
          fill="#8E8E93"
        >
          {label}
        </text>
      </svg>

      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-af-pink" />
          <span className="text-xs text-af-gray-dark">
            สำเร็จ {clamped.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-200" />
          <span className="text-xs text-af-gray-dark">
            คงเหลือ {(100 - clamped).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
