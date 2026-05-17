import AvatarSquare from "@/components/ui/AvatarSquare";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useNavigate } from "react-router-dom";
import { getOrgTypeConfig, isCreatorOrg } from "@/lib/orgTypes";
import { ActivityScoreMini } from "@/components/profile/ActivityScoreCard";
import { getDisplayFlags } from "@/utils/displayProfile";

export function getSubtitle(profile: any): string {
  if (profile?.headline) return profile.headline;
  if (profile?.role === "student") return [profile.role_metadata?.degree, profile.institution_name].filter(Boolean).join(" · ") || "Student";
  if (profile?.role === "faculty") return [profile.designation, profile.institution_name].filter(Boolean).join(" · ") || "Faculty";
  if (profile?.role === "researcher") return [profile.designation, profile.institution_name].filter(Boolean).join(" · ") || "Researcher";
  if (profile?.role === "founder") return profile.role_metadata?.company || profile.currently_working_at || "Founder";
  if (profile?.role === "creator") return profile.role_metadata?.platform || "Creator";
  const roleMap: Record<string, string> = {
    professional: "Professional", doctor: "Doctor", freelancer: "Freelancer",
    investor: "Investor", government: "Government", skilled_trade: "Skilled Trade",
    hr: "HR Professional",
  };
  return roleMap[profile?.role] || (profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1).replace(/_/g, " ") : "Tiikme Member");
}

interface PersonCardProps {
  p: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    role: string | null;
    role_subtype?: string | null;
    is_verified?: boolean | null;
    designation?: string | null;
    role_metadata?: any;
    institution_name?: string | null;
    currently_working_at?: string | null;
    account_type?: string | null;
    activity_score?: number | null;
    display_preference?: string | null;
  };
  strandStatus: string;
  onStrand: () => void;
  currentUserId?: string;
}

export function PersonCard({ p, strandStatus, onStrand, currentUserId }: PersonCardProps) {
  const navigate = useNavigate();
  const flags = getDisplayFlags(p);
  const name = flags.showName ? (p.full_name || p.username || "User") : "Tiikme member";
  const designation = p.designation || p.role_metadata?.jobTitle || (p.role ? p.role.charAt(0).toUpperCase() + p.role.slice(1).replace(/_/g, " ") : "");
  const company = p.currently_working_at || p.role_metadata?.company || p.institution_name || "";

  const isConnected = strandStatus === "accepted";
  const isPending = strandStatus === "pending";

  return (
    <article
      className="glass-card cursor-pointer"
      style={{
        display: "flex", gap: 12, padding: 14, borderRadius: 12,
        width: 280, minWidth: 280,
        scrollSnapAlign: "start", flexShrink: 0,
        transition: "transform 200ms, box-shadow 200ms",
        alignItems: "center",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(26,26,78,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      onClick={() => navigate(`/app/profile/${p.id}`)}
    >
      <AvatarSquare src={p.avatar_url} name={name} size={80} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, minWidth: 0 }}>
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="line-clamp-2 break-words" style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{name}</span>
          {p.is_verified && <VerifiedBadge size={14} />}
          {typeof p.activity_score === "number" && (
            <ActivityScoreMini score={p.activity_score} viewerIsOwner={currentUserId === p.id} />
          )}
          {p.account_type === "institution" && (
            <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 999, background: "rgba(37,99,235,0.10)", color: "#2563EB", marginLeft: 2 }}>
              Company
            </span>
          )}
        </div>
        {flags.showRole && (
          <span className="truncate" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {getSubtitle(p)}
          </span>
        )}
        {flags.showRole && p.role_subtype && (
          <span
            className="truncate"
            style={{
              fontSize: 11, color: "var(--text-muted)",
              background: "rgba(156,163,192,0.12)",
              padding: "1px 8px", borderRadius: 999,
              alignSelf: "flex-start", marginTop: 1,
            }}
          >
            {p.role_subtype}
          </span>
        )}
      </div>
      {currentUserId !== p.id && (
        <button
          type="button"
          disabled={strandStatus !== "none"}
          onClick={e => { e.stopPropagation(); onStrand(); }}
          className="cursor-pointer shrink-0 self-center"
          style={{
            padding: "6px 14px", borderRadius: 8,
            fontSize: 12, fontWeight: 600, border: "none",
            whiteSpace: "nowrap",
            ...(isConnected
              ? { background: "rgba(52,199,89,0.10)", color: "#34C759" }
              : isPending
              ? { background: "rgba(232,115,58,0.12)", color: "#E8733A" }
              : { background: "#FF5A1F", color: "#fff" }
            ),
          }}
        >
          {isConnected ? "Connected" : isPending ? "Requested" : "+ Connect"}
        </button>
      )}
    </article>
  );
}

interface OrgCardProps {
  org: any;
  following: boolean;
  onToggleFollow: (e: React.MouseEvent) => void;
  navigateTo: string;
}

export function OrgCard({ org, following, onToggleFollow, navigateTo }: OrgCardProps) {
  const navigate = useNavigate();
  const subtype = org.subtype || org.sub_type;
  const isCreator = isCreatorOrg(org.type, subtype);
  const followLabel = isCreator
    ? (following ? "Subscribed" : "+ Subscribe")
    : (following ? "Following"  : "+ Follow");

  // Compact secondary line: subscriber/employee count where useful
  const audience = org.followers_count != null ? org.followers_count : null;
  const audienceLabel = isCreator ? "subscribers" : "followers";
  const formatCount = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000   ? `${(n / 1_000).toFixed(1)}K`
    : String(n);

  return (
    <article
      className="glass-card cursor-pointer"
      style={{
        display: "flex", gap: 12, padding: 14, borderRadius: 12,
        width: 280, minWidth: 280,
        scrollSnapAlign: "start", flexShrink: 0,
        transition: "transform 200ms, box-shadow 200ms",
        alignItems: "center",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(26,26,78,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      onClick={() => navigate(navigateTo)}
    >
      <AvatarSquare src={org.logo_url} name={org.name || "?"} size={80} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4, minWidth: 0 }}>
        <span className="line-clamp-2 break-words" style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{org.name}</span>
        {(() => {
          const conf = getOrgTypeConfig(org.type || org.page_type);
          return (
            <span style={{
              display: "inline-flex", alignItems: "center", alignSelf: "flex-start",
              padding: "3px 8px", borderRadius: 6,
              fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
              background: conf.bg, color: conf.color,
              textTransform: "uppercase",
            }}>
              {conf.label}
              {subtype && <span style={{ marginLeft: 6, opacity: 0.7, textTransform: "none", fontWeight: 500 }}>· {subtype}</span>}
            </span>
          );
        })()}
        {audience != null && audience > 0 && (
          <span className="truncate" style={{ fontSize: 11, color: "var(--text-muted)" }}>
            <span className="num">{formatCount(audience)}</span> {audienceLabel}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onToggleFollow(e); }}
        className="cursor-pointer shrink-0 self-center"
        style={{
          padding: "6px 14px", borderRadius: 8,
          fontSize: 12, fontWeight: 600, border: "none",
          whiteSpace: "nowrap",
          ...(following
            ? { background: "rgba(52,199,89,0.10)", color: "#34C759" }
            : isCreator
              ? { background: "#EF4444", color: "#fff" }
              : { background: "#FF5A1F", color: "#fff" }
          ),
        }}
      >
        {followLabel}
      </button>
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
      onClick={() => navigate(`/app/feed?post=${post.id}`)}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <AvatarSquare src={authorProfile?.avatar_url} name={name} size={28} />
        <p className="line-clamp-2 break-words" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>{name}</p>
        <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)", flexShrink: 0 }}>{timeAgo}</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 400, lineHeight: "18px", color: "var(--text-secondary)", flex: 1, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {post.content}
      </p>
      {firstImage && (
        <img src={firstImage} alt="" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginTop: 6 }} />
      )}
      <p style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)", marginTop: 8 }}>
        <span className="num">{reactionTotal}</span> likes · <span className="num">{post.comment_count || 0}</span> comments
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
      #{tag} <span className="num" style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>{count}</span>
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
      className="glass-card cursor-pointer"
      style={{
        display: "flex", gap: 12, padding: 14, borderRadius: 12,
        width: 280, minWidth: 280,
        scrollSnapAlign: "start", flexShrink: 0,
        transition: "transform 200ms, box-shadow 200ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(26,26,78,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      onClick={() => slug ? navigate(`/p/${slug}`) : undefined}
    >
      <AvatarSquare src={page?.logo_url} name={name} size={64} bgColor="#7C3AED" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 1, minWidth: 0 }}>
        <span className="line-clamp-2 break-words" style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{name}</span>
        {stage && (
          <span style={{ fontSize: 12, color: "#7C3AED" }}>{stage}</span>
        )}
        {sectors.length > 0 && (
          <span className="truncate" style={{ fontSize: 12, color: "var(--text-muted)" }}>{sectors.slice(0, 3).join(", ")}</span>
        )}
        <span
          className="cursor-pointer"
          style={{
            marginTop: 6, padding: "5px 16px", borderRadius: 8,
            fontSize: 12, fontWeight: 600, border: "none",
            alignSelf: "flex-start",
            background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff",
          }}
        >Learn More</span>
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
      className="glass-card cursor-pointer"
      style={{
        display: "flex", gap: 12, padding: 14, borderRadius: 12,
        width: 280, minWidth: 280,
        scrollSnapAlign: "start", flexShrink: 0,
        transition: "transform 200ms, box-shadow 200ms",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(26,26,78,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      onClick={() => navigate(`/app/profile/${investor.id}`)}
    >
      <AvatarSquare src={investor.avatar_url} name={name} size={64} bgColor="#059669" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 1, minWidth: 0 }}>
        <span className="line-clamp-2 break-words" style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{name}</span>
        <span style={{ fontSize: 12, color: "#059669" }}>Investor</span>
        {range && <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{range}</span>}
        {sectors.length > 0 && (
          <span className="truncate" style={{ fontSize: 12, color: "var(--text-muted)" }}>{sectors.slice(0, 2).join(", ")}</span>
        )}
      </div>
    </article>
  );
}
