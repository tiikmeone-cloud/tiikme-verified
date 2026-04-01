import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FrostedProfileCardProps {
  name: string;
  initials: string;
  role: string;
  roleColor: string;
  institution: string;
  headline: string;
  verified: "gold" | "grey" | "none";
  contextBadge?: string;
  onConnect?: () => void;
  className?: string;
}

const FrostedProfileCard = ({ name, initials, role, roleColor, institution, headline, verified, contextBadge, onConnect, className = "" }: FrostedProfileCardProps) => {
  return (
    <div className={`group relative w-[260px] h-[300px] rounded-2xl overflow-hidden shrink-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border border-border/30 ${className}`}
      style={{ background: "var(--surface)" }}>
      {/* Top 60% — avatar / color area */}
      <div className="absolute inset-0 h-[60%]" style={{ background: `linear-gradient(135deg, ${roleColor}22 0%, ${roleColor}08 100%)` }}>
        <div className="flex items-center justify-center h-full">
          <div className="relative">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white transition-transform duration-200 group-hover:scale-105"
              style={{ backgroundColor: roleColor }}>
              {initials}
            </div>
            {verified === "gold" && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#F59E0B", boxShadow: "0 0 8px rgba(245,158,11,0.5)" }}>
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            {verified === "grey" && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#6B7280] flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Frosted glass bottom overlay */}
      <div className="absolute bottom-0 w-full pt-14 pb-5 px-5"
        style={{
          background: "linear-gradient(to top, var(--surface) 60%, var(--surface)/90 80%, transparent)",
          backdropFilter: "blur(2px)",
        }}>
        <div className="text-center">
          <Link to="/app/profile" className="text-[15px] font-bold text-t1 hover:text-brand transition-colors">
            {name}
          </Link>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${roleColor}14`, color: roleColor }}>
              {role}
            </span>
            <Link to="/app/institution/1" className="text-[10px] text-t3 hover:text-brand transition-colors">{institution}</Link>
          </div>
          <p className="text-[12px] text-t2 mt-2 line-clamp-2 leading-relaxed">{headline}</p>
          {contextBadge && (
            <p className="text-[11px] font-bold mt-1.5 px-2.5 py-1 rounded-full inline-block transition-all duration-300"
              style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>
              {contextBadge}
            </p>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="w-full mt-3 rounded-full transition-all duration-200 active:scale-95"
          onClick={onConnect || (() => toast.success("Strand request sent"))}
        >
          Connect
        </Button>
      </div>
    </div>
  );
};

export default FrostedProfileCard;
