import { TrendingUp } from "lucide-react";
import { getActivityTier } from "@/lib/algorithms";

interface ActivityScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  trend?: string;
  percentile?: string;
}

const ActivityScoreRing = ({ score, size = 80, strokeWidth = 6, trend = "+5 this week" }: ActivityScoreRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeScore = (isNaN(score) || score == null) ? 0 : score;
  const progress = (Math.min(safeScore, 100) / 100) * circumference;
  const tier = getActivityTier(score);

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-subtle)" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={tier.color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={circumference - progress}
            strokeLinecap="round" className="transition-all duration-700 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="num" style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{score}</span>
        </div>
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Activity Score</p>
        <p style={{ fontSize: 12, fontWeight: 600, color: tier.color }}>{tier.name}</p>
        <div className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 600, color: "var(--success)" }}>
          <TrendingUp style={{ width: 12, height: 12 }} />
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityScoreRing;
