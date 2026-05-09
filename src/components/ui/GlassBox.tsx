import { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

const ACCENT_COLORS: Record<string, string> = {
  identity: "#FF5A1F",
  experience: "#4A90D9",
  education: "#34C759",
  projects: "#FF6B9D",
  achievements: "#FFB800",
  skills: "#8B5CF6",
  location: "#06B6D4",
  contact: "#64748B",
  posts: "#E8733A",
  connections: "#6366F1",
  leadership: "#F59E0B",
  stats: "#10B981",
  team: "#8B5CF6",
  opportunities: "#3B82F6",
  verified: "#F59E0B",
  feed: "#FF5A1F",
};

/* Left-glow shadow per accent */
const glowShadow = (color: string, hover = false) => {
  const opacity = hover ? 0.35 : 0.20;
  const spread = hover ? 20 : 16;
  const baseShadow = `0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)`;
  return `-3px 0 ${spread}px rgba(${hexToRgb(color)},${opacity}), ${baseShadow}`;
};

const expandedGlow = (color: string) =>
  `-3px 0 20px rgba(${hexToRgb(color)},0.30), 0 8px 40px rgba(${hexToRgb(color)},0.15), 0 16px 60px rgba(0,0,0,0.10)`;

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  return `${parseInt(h.substring(0, 2), 16)},${parseInt(h.substring(2, 4), 16)},${parseInt(h.substring(4, 6), 16)}`;
}

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
        "relative transition-all duration-300",
        onClick && "cursor-pointer",
        expanded && spanFull && "col-span-1 md:col-span-2",
        className
      )}
      style={{
        background: "rgba(255, 255, 255, 0.72)",
        border: "1px solid rgba(255, 255, 255, 0.9)",
        borderLeft: `2px solid ${color}66`,
        borderRadius: 16,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: expanded ? expandedGlow(color) : glowShadow(color),
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!expanded) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = glowShadow(color, true);
        }
      }}
      onMouseLeave={(e) => {
        if (!expanded) {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = glowShadow(color);
        }
      }}
    >
      <div className="relative z-[1]" style={{ padding: 14 }}>{children}</div>
    </div>
  );
};

export default GlassBox;
export { ACCENT_COLORS };
