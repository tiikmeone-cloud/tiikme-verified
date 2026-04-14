import { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

const ACCENT_COLORS: Record<string, string> = {
  identity: "#E8580A",
  experience: "#3B82F6",
  education: "#8B5CF6",
  projects: "#10B981",
  achievements: "#F59E0B",
  skills: "#EC4899",
  location: "#06B6D4",
  contact: "#64748B",
  posts: "#E8580A",
  connections: "#6366F1",
  leadership: "#F59E0B",
  stats: "#10B981",
  team: "#8B5CF6",
  opportunities: "#3B82F6",
  verified: "#F59E0B",
  feed: "#E8580A",
};

interface GlassBoxProps {
  accent: keyof typeof ACCENT_COLORS | string;
  expanded?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  spanFull?: boolean;
}

const GlassBox = ({ accent, expanded, onClick, children, className, style, spanFull }: GlassBoxProps) => {
  const color = ACCENT_COLORS[accent] || accent;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative transition-all duration-[400ms]",
        onClick && "cursor-pointer",
        expanded && spanFull && "col-span-1 md:col-span-2",
        className
      )}
      style={{
        background: "rgba(255, 255, 255, 0.72)",
        border: expanded
          ? `2px solid ${color}`
          : "1px solid rgba(255, 255, 255, 0.9)",
        borderLeft: `4px solid ${color}`,
        borderRadius: 20,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: expanded
          ? `0 0 0 2px ${color}, 0 8px 40px ${color}2E, 0 24px 80px rgba(0,0,0,0.12)`
          : "0 2px 8px rgba(232,88,10,0.06), 0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.03)",
        transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!expanded) {
          e.currentTarget.style.transform = "translateY(-2px) scale(1.01)";
          e.currentTarget.style.boxShadow =
            "0 4px 16px rgba(232,88,10,0.12), 0 16px 48px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,1)";
        }
      }}
      onMouseLeave={(e) => {
        if (!expanded) {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow =
            "0 2px 8px rgba(232,88,10,0.06), 0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.03)";
        }
      }}
    >
      <div className="relative z-[1] p-5">{children}</div>
    </div>
  );
};

export default GlassBox;
export { ACCENT_COLORS };
