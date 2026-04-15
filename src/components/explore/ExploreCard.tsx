import AvatarSquare from "@/components/ui/AvatarSquare";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  student: { bg: "rgba(109,40,217,0.12)", text: "#6D28D9" },
  professional: { bg: "rgba(22,101,52,0.12)", text: "#166534" },
  hr: { bg: "rgba(194,65,12,0.12)", text: "#C2410C" },
  government: { bg: "rgba(217,119,6,0.12)", text: "#D97706" },
  doctor: { bg: "rgba(14,116,144,0.12)", text: "#0E7490" },
  faculty: { bg: "rgba(146,64,14,0.12)", text: "#92400E" },
  skilled_trade: { bg: "rgba(194,65,12,0.12)", text: "#C2410C" },
  aspirant: { bg: "rgba(55,65,81,0.12)", text: "#374151" },
  builder: { bg: "rgba(124,58,237,0.12)", text: "#7C3AED" },
};

interface PersonCardProps {
  p: { id: string; full_name: string | null; username: string | null; avatar_url: string | null; role: string | null; location_city: string | null };
  strandStatus: string;
  onStrand: () => void;
  currentUserId?: string;
}

export function PersonCard({ p, strandStatus, onStrand, currentUserId }: PersonCardProps) {
  const navigate = useNavigate();
  const name = p.full_name || p.username || "User";
  const role = p.role || "student";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
  const colors = ROLE_COLORS[role] || { bg: "rgba(107,112,148,0.12)", text: "#6B7094" };

  const isConnected = strandStatus === "accepted";
  const isPending = strandStatus === "pending";

  return (
    <article
      className="glass-card cursor-pointer flex flex-col items-center text-center"
      style={{
        width: 190, minWidth: 190, padding: 12, borderRadius: 16,
        scrollSnapAlign: "start", flexShrink: 0,
        transition: "transform 200ms, box-shadow 200ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(26,26,78,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      onClick={() => navigate(`/app/profile/${p.id}`)}
    >
      <AvatarSquare src={p.avatar_url} name={name} size={56} bgColor={colors.text} />
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginTop: 8, width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 99, marginTop: 4, background: colors.bg, color: colors.text, flexShrink: 0 }}>{roleLabel}</span>
      {p.location_city && (
        <p style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} /> {p.location_city}
        </p>
      )}
      <div style={{ marginTop: "auto", width: "100%", paddingTop: 8 }}>
        {currentUserId !== p.id && (
          <button
            type="button"
            disabled={strandStatus !== "none"}
            onClick={(e) => { e.stopPropagation(); onStrand(); }}
            style={{
              width: "100%", height: 32, borderRadius: 12, fontSize: 11, fontWeight: 700,
              transition: "all 150ms", cursor: strandStatus === "none" ? "pointer" : "default",
              ...(isConnected
                ? { background: "rgba(52,199,89,0.10)", color: "#34C759", border: "1px solid rgba(52,199,89,0.25)" }
                : isPending
                ? { background: "rgba(232,115,58,0.12)", color: "#E8733A", border: "1px solid rgba(232,115,58,0.25)" }
                : { background: "var(--bg-card)", backdropFilter: "blur(12px)", color: "var(--text-primary)", border: "1px solid var(--border-glass)" }
              ),
            }}
          >
            {isConnected ? "Connected" : isPending ? "Requested" : "Connect"}
          </button>
        )}
      </div>
    </article>
  );
}

const ORG_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  company: { bg: "rgba(29,78,216,0.12)", text: "#1D4ED8" },
  education: { bg: "rgba(52,199,89,0.12)", text: "#34C759" },
  college: { bg: "rgba(52,199,89,0.12)", text: "#34C759" },
  hospital: { bg: "rgba(190,18,60,0.12)", text: "#BE123C" },
  government: { bg: "rgba(21,128,61,0.12)", text: "#15803D" },
  ngo: { bg: "rgba(109,40,217,0.12)", text: "#6D28D9" },
  startup: { bg: "rgba(124,58,237,0.12)", text: "#7C3AED" },
};

interface OrgCardProps {
  org: any;
  following: boolean;
  onToggleFollow: (e: React.MouseEvent) => void;
  navigateTo: string;
}

export function OrgCard({ org, following, onToggleFollow, navigateTo }: OrgCardProps) {
  const navigate = useNavigate();
  const typeKey = org.type || org.page_type || "company";
  const typeColors = ORG_TYPE_COLORS[typeKey] || { bg: "rgba(107,112,148,0.12)", text: "#6B7094" };
  const typeLabel = typeKey.charAt(0).toUpperCase() + typeKey.slice(1);

  return (
    <article
      className="glass-card cursor-pointer flex flex-col items-center text-center"
      style={{
        width: 190, minWidth: 190, padding: 12, borderRadius: 16,
        scrollSnapAlign: "start", flexShrink: 0,
        transition: "transform 200ms, box-shadow 200ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(26,26,78,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      onClick={() => navigate(navigateTo)}
    >
      <AvatarSquare src={org.logo_url} name={org.name || "?"} size={56} bgColor={typeColors.text} />
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginTop: 8, width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{org.name}</p>
      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 99, marginTop: 4, background: typeColors.bg, color: typeColors.text }}>{typeLabel}</span>
      {(org.city || org.location_city) && (
        <p style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} /> {org.city || org.location_city}
        </p>
      )}
      <div style={{ marginTop: "auto", width: "100%", paddingTop: 8 }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFollow(e); }}
          style={{
            width: "100%", height: 32, borderRadius: 12, fontSize: 11, fontWeight: 700,
            transition: "all 150ms", cursor: "pointer", border: "none",
            ...(following
              ? { background: "rgba(52,199,89,0.10)", color: "#34C759", border: "1px solid rgba(52,199,89,0.25)" }
              : { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", boxShadow: "0 4px 14px rgba(232,115,58,0.25)" }
            ),
          }}
        >
          {following ? "Following" : "Follow"}
        </button>
      </div>
    </article>
  );
}

interface PostCardProps { post: any; authorProfile?: any; }

export function TrendingPostCard({ post, authorProfile }: PostCardProps) {
  const navigate = useNavigate();
  const name = authorProfile?.full_name || "User";
  const reactionTotal = (post.reactions?.useful || 0) + (post.reactions?.inspiring || 0) + (post.reactions?.insightful || 0);
  const timeAgo = (() => {
    const diff = Date.now() - new Date(post.created_at).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}m`;
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  })();
  const firstImage = (post.image_urls || [])[0];

  return (
    <article
      className="glass-card cursor-pointer flex flex-col"
      style={{
        width: 280, minWidth: 280, padding: 12, borderRadius: 12,
        scrollSnapAlign: "start", flexShrink: 0,
        transition: "transform 200ms, box-shadow 200ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(26,26,78,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      onClick={() => navigate(`/app/post/${post.id}`)}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <AvatarSquare src={authorProfile?.avatar_url} name={name} size={28} />
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{name}</p>
        <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)", flexShrink: 0 }}>{timeAgo}</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 400, lineHeight: "18px", color: "var(--text-secondary)", flex: 1, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {post.content}
      </p>
      {firstImage && (
        <img src={firstImage} alt="" loading="lazy" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginTop: 6 }} />
      )}
      <p style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)", marginTop: 8 }}>
        {reactionTotal} likes · {post.comment_count || 0} comments
      </p>
    </article>
  );
}

interface TopicPillProps { tag: string; count: number; onClick: () => void; }

export function TopicPill({ tag, count, onClick }: TopicPillProps) {
  return (
    <button type="button" onClick={onClick}
      style={{
        flexShrink: 0, scrollSnapAlign: "start", cursor: "pointer",
        padding: "0 18px", height: 34, borderRadius: 12,
        background: "var(--bg-card)", border: "1px solid var(--border-glass)",
        color: "#E8733A", fontSize: 13, fontWeight: 600,
        transition: "transform 150ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
    >
      #{tag} <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)", marginLeft: 4 }}>{count}</span>
    </button>
  );
}

/* ── Startup Card ── */
export function StartupCard({ startup, page }: { startup: any; page?: any }) {
  const navigate = useNavigate();
  const name = page?.name || startup?.name || "Startup";
  const slug = page?.slug;
  const sectors = startup?.sectors || [];
  const stage = startup?.funding_stage;

  return (
    <article
      className="glass-card cursor-pointer flex flex-col items-center text-center"
      style={{
        width: 190, minWidth: 190, padding: 12, borderRadius: 16,
        scrollSnapAlign: "start", flexShrink: 0,
        transition: "transform 200ms, box-shadow 200ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(26,26,78,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      onClick={() => slug ? navigate(`/page/${slug}`) : undefined}
    >
      <AvatarSquare src={page?.logo_url} name={name} size={56} bgColor="#7C3AED" />
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginTop: 8, width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
      {stage && (
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 99, marginTop: 4, background: "rgba(124,58,237,0.12)", color: "#7C3AED" }}>{stage}</span>
      )}
      {sectors.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center" style={{ marginTop: 6 }}>
          {sectors.slice(0, 3).map((s: string) => (
            <span key={s} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 99, background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>{s}</span>
          ))}
        </div>
      )}
      <div style={{ marginTop: "auto", width: "100%", paddingTop: 8 }}>
        <span style={{
          display: "block", width: "100%", height: 32, borderRadius: 12, fontSize: 11, fontWeight: 700,
          lineHeight: "32px", textAlign: "center",
          background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff",
          boxShadow: "0 4px 16px rgba(124,58,237,0.25)",
        }}>Learn More</span>
      </div>
    </article>
  );
}

/* ── Investor Card ── */
export function InvestorCard({ investor }: { investor: any }) {
  const navigate = useNavigate();
  const name = investor.full_name || "Investor";
  const meta = investor.role_metadata as any;
  const ip = meta?.investor_profile;
  const sectors = ip?.sectors || [];
  const range = ip?.investment_min && ip?.investment_max
    ? `₹${(ip.investment_min / 100000).toFixed(0)}L – ₹${(ip.investment_max / 100000).toFixed(0)}L`
    : ip?.investment_min ? `₹${(ip.investment_min / 100000).toFixed(0)}L+` : null;

  return (
    <article
      className="glass-card cursor-pointer flex flex-col items-center text-center"
      style={{
        width: 190, minWidth: 190, padding: 12, borderRadius: 16,
        scrollSnapAlign: "start", flexShrink: 0,
        transition: "transform 200ms, box-shadow 200ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(26,26,78,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      onClick={() => navigate(`/app/profile/${investor.id}`)}
    >
      <AvatarSquare src={investor.avatar_url} name={name} size={56} bgColor="#059669" />
      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginTop: 8, width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 99, marginTop: 4, background: "rgba(5,150,105,0.12)", color: "#059669" }}>Investor</span>
      {range && <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>{range}</p>}
      {sectors.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center" style={{ marginTop: 6 }}>
          {sectors.slice(0, 2).map((s: string) => (
            <span key={s} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 99, background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>{s}</span>
          ))}
        </div>
      )}
    </article>
  );
}
