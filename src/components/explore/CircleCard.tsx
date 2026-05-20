import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import AvatarSquare from "@/components/ui/AvatarSquare";

interface CircleCardProps {
  circle: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    icon_url?: string | null;
    member_count?: number;
    active_7d?: number;
    type?: string;
  };
  latestPostTitle?: string | null;
  onJoin?: (e: React.MouseEvent) => void;
  isMember?: boolean;
}

const CircleCard = ({ circle, latestPostTitle, onJoin, isMember }: CircleCardProps) => {
  const navigate = useNavigate();
  const memberCount = circle.member_count ?? 0;

  return (
    <article
      className="glass-card cursor-pointer flex flex-col"
      style={{
        padding: 14, borderRadius: 12, gap: 10,
        transition: "transform 200ms, box-shadow 200ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(26,26,78,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      onClick={() => navigate(`/app/circles/${circle.slug}`)}
    >
      <div className="flex items-center" style={{ gap: 10 }}>
        <AvatarSquare src={circle.icon_url} name={circle.name} size={48} bgColor="#7C3AED" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center" style={{ gap: 4 }}>
            <span className="truncate" style={{ fontSize: 10, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Circle
            </span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, lineHeight: "18px", color: "var(--text-primary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>
            {circle.name}
          </p>
          <div className="flex items-center" style={{ gap: 4, fontSize: 11, color: "var(--text-muted)" }}>
            <Users style={{ width: 11, height: 11 }} />
            <span><span className="num">{memberCount.toLocaleString()}</span> members</span>
          </div>
        </div>
      </div>

      {circle.description && (
        <p style={{
          fontSize: 12, lineHeight: "16px", color: "var(--text-secondary)",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {circle.description}
        </p>
      )}

      {latestPostTitle && (
        <div style={{
          padding: "6px 10px", borderRadius: 8,
          background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.12)",
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "#7C3AED", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>
            Latest post
          </p>
          <p style={{ fontSize: 12, lineHeight: "16px", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", wordBreak: "break-word" }}>
            {latestPostTitle}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onJoin}
        className="cursor-pointer"
        style={{
          padding: "8px 14px", borderRadius: 8,
          fontSize: 12, fontWeight: 600, border: "none",
          background: isMember ? "rgba(52,199,89,0.10)" : "linear-gradient(135deg, #7C3AED, #A855F7)",
          color: isMember ? "#34C759" : "#fff",
        }}
      >
        {isMember ? "Joined" : "Join Circle"}
      </button>
    </article>
  );
};

export default CircleCard;
