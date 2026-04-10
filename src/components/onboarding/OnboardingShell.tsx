import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  step: number;
  totalSteps?: number;
  showBack?: boolean;
  backTo?: string;
  children: ReactNode;
}

export default function OnboardingShell({ step, totalSteps = 5, showBack = false, backTo, children }: Props) {
  const navigate = useNavigate();
  const dots = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12 relative" style={{ background: "#FFF8F2" }}>
      {/* Back button */}
      {showBack && backTo && (
        <button
          onClick={() => navigate(backTo)}
          className="absolute top-6 left-6 flex items-center gap-1 text-[13px] font-medium cursor-pointer hover:opacity-70 transition-opacity"
          style={{ color: "#6B7280" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}

      {/* Logo */}
      <div className="flex items-center gap-1.5 mb-6">
        <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 18, color: "#111827" }}>tiikme</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="#E8580A" />
          <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-0 mb-8">
        {dots.map((d, i) => (
          <div key={d} className="flex items-center">
            <div
              className="w-3 h-3 rounded-full border-2 transition-all duration-300"
              style={{
                borderColor: d <= step ? "#E8580A" : "#D1D5DB",
                background: d <= step ? "#E8580A" : "transparent",
              }}
            />
            {i < dots.length - 1 && (
              <div className="w-8 h-[2px]" style={{ background: d < step ? "#E8580A" : "#E5E7EB" }} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="w-full max-w-[600px]">
        {children}
      </div>
    </div>
  );
}
