import { TrendingUp } from "lucide-react";

interface ActivityScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  trend?: string;
  percentile?: string;
}

const ActivityScoreRing = ({ score, size = 80, strokeWidth = 6, trend = "+5 this week", percentile = "Top 15% of Students" }: ActivityScoreRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border-2)" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--brand)" strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={circumference - progress}
            strokeLinecap="round" className="transition-all duration-700 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[18px] font-extrabold text-t1">{score}</span>
        </div>
      </div>
      <div>
        <p className="text-[13px] font-bold text-t1">Activity Score</p>
        <p className="text-[11px] text-t3 mb-0.5">{percentile}</p>
        <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "var(--open-green)" }}>
          <TrendingUp className="w-3 h-3" />
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityScoreRing;
