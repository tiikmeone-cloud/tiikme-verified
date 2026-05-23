// src/components/ActivityScoreRing.tsx
// FIXED:
// - No duplicate score number (ring shows score inside, no external duplicate)
// - Animation plays ONCE on mount, then static
// - Uses shared TIERS from activityTiers.ts
// - No cover banner (this is a widget, not a profile header)

import React, { useEffect, useState } from "react";
import { getTier, getTierProgress, getPointsToNextTier } from "@/lib/activityTiers";

interface ActivityScoreRingProps {
  score: number;
  size?: number;
  showTip?: boolean;
}

export function ActivityScoreRing({ score, size = 64, showTip = false }: ActivityScoreRingProps) {
  const tier = getTier(score);
  const progress = getTierProgress(score);
  const pointsToNext = getPointsToNextTier(score);
  const [animated, setAnimated] = useState(false);

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  // Animate once on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F5F5F5"
            strokeWidth={4}
          />
          {/* Progress arc — transitions ONCE */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tier.color}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? offset : circumference}
            style={{
              transition: animated ? "stroke-dashoffset 700ms ease-out" : "none",
            }}
          />
        </svg>
        {/* Score in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-bold leading-none"
            style={{ color: tier.color, fontSize: Math.round(size * 0.28) }}
          >
            {score}
          </span>
        </div>
      </div>
      {/* Tier name below ring */}
      <span
        className="text-xs font-medium mt-1"
        style={{ color: tier.color }}
      >
        {tier.name}
      </span>
      {/* Tip */}
      {showTip && pointsToNext > 0 && (
        <span className="text-[10px] text-gray-400 mt-0.5 text-center">
          {pointsToNext} pts to next tier
        </span>
      )}
    </div>
  );
}

// Feed sidebar widget version — compact with CTA
export function ActivityWidget({ score }: { score: number }) {
  return (
    <div className="bg-[#FFF3EC] rounded-2xl p-4 text-center">
      <ActivityScoreRing score={score} size={72} showTip />
      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
        Post more, get verified,<br />connect with others
      </p>
    </div>
  );
}

export default ActivityScoreRing;
