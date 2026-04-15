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

  return (
    <article
      className="glass-light cursor-pointer flex flex-col items-center text-center shrink-0 transition-transform duration-200 hover:-translate-y-1"
      style={{ width: 180, minWidth: 180, padding: 14, borderRadius: 16, scrollSnapAlign: "start" }}
      onClick={() => navigate(`/app/profile/${p.id}`)}
    >
      <AvatarSquare src={p.avatar_url} name={name} size={56} bgColor={colors.text} />
      <p className="text-[14px] font-semibold leading-tight w-full mt-2 truncate" style={{ color: "var(--color-text)" }}>{name}</p>
      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-1 shrink-0" style={{ background: colors.bg, color: colors.text }}>{roleLabel}</span>
      {p.location_city && (
        <p className="text-[11px] truncate w-full mt-1 flex items-center justify-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
          <MapPin className="w-3 h-3 shrink-0" /> {p.location_city}
        </p>
      )}
      <div className="mt-auto w-full pt-2">
        {currentUserId !== p.id && (
          <button
            type="button"
            disabled={strandStatus !== "none"}
            onClick={(e) => { e.stopPropagation(); onStrand(); }}
            className="w-full h-8 rounded-xl text-[11px] font-bold transition-all"
            style={
              strandStatus === "accepted"
                ? { background: "rgba(52,199,89,0.12)", color: "#34C759", border: "1px solid rgba(52,199,89,0.25)" }
                : strandStatus === "pending"
                ? { background: "rgba(232,115,58,0.12)", color: "#E8733A", border: "1px solid rgba(232,115,58,0.25)" }
                : { background: "var(--glass-bg)", backdropFilter: "blur(12px)", color: "var(--color-text)", border: "1px solid var(--glass-border)", cursor: "pointer" }
            }
          >
            {strandStatus === "accepted" ? "Connected" : strandStatus === "pending" ? "Requested" : "Connect"}
          </button>
        )}
      </div>
    </article>
  );
}

const ORG_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  company: { bg: "rgba(29,78,216,0.12)", text: "#1D4ED8" },
  education: { bg: "rgba(29,78,216,0.12)", text: "#1D4ED8" },
  college: { bg: "rgba(29,78,216,0.12)", text: "#1D4ED8" },
  hospital: { bg: "rgba(190,18,60,0.12)", text: "#BE123C" },
  government: { bg: "rgba(21,128,61,0.12)", text: "#15803D" },
  ngo: { bg: "rgba(109,40,217,0.12)", text: "#6D28D9" },
};

interface OrgCardProps {
  org: any;
  following: boolean;
  onToggleFollow: (e: React.MouseEvent) => void;
  navigateTo: string;
}

export function OrgCard({ org, following, onToggleFollow, navigateTo }: OrgCardProps) {
  const navigate = useNavigate();
  const typeColors = ORG_TYPE_COLORS[org.type || org.page_type] || { bg: "rgba(107,112,148,0.12)", text: "#6B7094" };
  const typeLabel = (org.type || org.page_type || "org").charAt(0).toUpperCase() + (org.type || org.page_type || "org").slice(1);

  return (
    <article
      className="glass-light cursor-pointer flex flex-col items-center text-center shrink-0 transition-transform duration-200 hover:-translate-y-1"
      style={{ width: 180, minWidth: 180, padding: 14, borderRadius: 16, scrollSnapAlign: "start" }}
      onClick={() => navigate(navigateTo)}
    >
      <AvatarSquare src={org.logo_url} name={org.name || "?"} size={56} bgColor={typeColors.text} />
      <p className="text-[14px] font-semibold leading-tight w-full mt-2 truncate" style={{ color: "var(--color-text)" }}>{org.name}</p>
      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-1 shrink-0" style={{ background: typeColors.bg, color: typeColors.text }}>{typeLabel}</span>
      {(org.city || org.location_city) && (
        <p className="text-[11px] truncate w-full mt-1 flex items-center justify-center gap-1" style={{ color: "var(--color-text-secondary)" }}>
          <MapPin className="w-3 h-3 shrink-0" /> {org.city || org.location_city}
        </p>
      )}
      {org.naac_grade && <p className="text-[10px] mt-0.5 font-semibold" style={{ color: "#D97706" }}>NAAC {org.naac_grade}</p>}
      {org.nabh_accredited && <p className="text-[10px] mt-0.5 font-semibold" style={{ color: "#15803D" }}>NABH Accredited</p>}
      <div className="mt-auto w-full pt-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleFollow(e); }}
          className="w-full h-8 rounded-xl text-[11px] font-bold transition-all"
          style={following
            ? { background: "rgba(52,199,89,0.12)", color: "#34C759", border: "1px solid rgba(52,199,89,0.25)" }
            : { background: "linear-gradient(135deg, #E8733A, #FF6B9D)", color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(232,115,58,0.25)" }
          }
        >
          {following ? "Following" : "Follow"}
        </button>
      </div>
    </article>
  );
}

interface PostCardProps {
  post: any;
  authorProfile?: any;
}

export function TrendingPostCard({ post, authorProfile }: PostCardProps) {
  const navigate = useNavigate();
  const name = authorProfile?.full_name || "User";
  const reactionTotal = (post.reactions?.useful || 0) + (post.reactions?.inspiring || 0) + (post.reactions?.insightful || 0);

  return (
    <article
      className="glass-light cursor-pointer flex flex-col shrink-0 transition-transform duration-200 hover:-translate-y-1"
      style={{ width: 220, minWidth: 220, padding: 14, borderRadius: 16, scrollSnapAlign: "start" }}
      onClick={() => navigate(`/app/post/${post.id}`)}
    >
      <div className="flex items-center gap-2 mb-2">
        <AvatarSquare src={authorProfile?.avatar_url} name={name} size={28} />
        <p className="text-[12px] font-semibold truncate" style={{ color: "var(--color-text)" }}>{name}</p>
      </div>
      <p className="text-[12px] leading-relaxed flex-1" style={{ color: "var(--color-text-secondary)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {post.content}
      </p>
      <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: "1px solid var(--glass-border-subtle)" }}>
        <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{reactionTotal} reactions</span>
        <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{post.comment_count || 0} comments</span>
      </div>
    </article>
  );
}

interface TopicPillProps {
  tag: string;
  count: number;
  onClick: () => void;
}

export function TopicPill({ tag, count, onClick }: TopicPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all hover:-translate-y-0.5"
      style={{ background: "var(--glass-bg)", backdropFilter: "blur(12px)", border: "1px solid var(--glass-border)", color: "var(--color-accent)", scrollSnapAlign: "start", cursor: "pointer" }}
    >
      #{tag} <span className="text-[11px] ml-1 font-normal" style={{ color: "var(--color-text-muted)" }}>{count}</span>
    </button>
  );
}

/* ── Startup Card ── */
interface StartupCardProps {
  startup: any;
  page?: any;
}

export function StartupCard({ startup, page }: StartupCardProps) {
  const navigate = useNavigate();
  const name = page?.name || startup?.name || "Startup";
  const slug = page?.slug;
  const sectors = startup?.sectors || [];
  const stage = startup?.funding_stage;

  return (
    <article
      className="glass-light cursor-pointer flex flex-col items-center text-center shrink-0 transition-transform duration-200 hover:-translate-y-1"
      style={{ width: 200, minWidth: 200, padding: 14, borderRadius: 16, scrollSnapAlign: "start" }}
      onClick={() => slug ? navigate(`/page/${slug}`) : undefined}
    >
      <AvatarSquare src={page?.logo_url} name={name} size={56} bgColor="#7C3AED" />
      <p className="text-[14px] font-semibold leading-tight w-full mt-2 truncate" style={{ color: "var(--color-text)" }}>{name}</p>
      {stage && (
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1" style={{ background: "rgba(124,58,237,0.12)", color: "#7C3AED" }}>
          {stage}
        </span>
      )}
      {sectors.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5 justify-center">
          {sectors.slice(0, 3).map((s: string) => (
            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--glass-bg)", color: "var(--color-text-muted)", border: "1px solid var(--glass-border-subtle)" }}>{s}</span>
          ))}
        </div>
      )}
      <div className="mt-auto w-full pt-2">
        <span className="inline-block w-full h-8 rounded-xl text-[11px] font-bold leading-[32px]"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "#fff", boxShadow: "0 4px 16px rgba(124,58,237,0.25)" }}>
          Learn More
        </span>
      </div>
    </article>
  );
}

/* ── Investor Card ── */
interface InvestorCardProps {
  investor: any;
}

export function InvestorCard({ investor }: InvestorCardProps) {
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
      className="glass-light cursor-pointer flex flex-col items-center text-center shrink-0 transition-transform duration-200 hover:-translate-y-1"
      style={{ width: 180, minWidth: 180, padding: 14, borderRadius: 16, scrollSnapAlign: "start" }}
      onClick={() => navigate(`/app/profile/${investor.id}`)}
    >
      <AvatarSquare src={investor.avatar_url} name={name} size={56} bgColor="#059669" />
      <p className="text-[14px] font-semibold leading-tight w-full mt-2 truncate" style={{ color: "var(--color-text)" }}>{name}</p>
      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1" style={{ background: "rgba(5,150,105,0.12)", color: "#059669" }}>Investor</span>
      {range && <p className="text-[11px] mt-1" style={{ color: "var(--color-text-secondary)" }}>{range}</p>}
      {sectors.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5 justify-center">
          {sectors.slice(0, 2).map((s: string) => (
            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--glass-bg)", color: "var(--color-text-muted)", border: "1px solid var(--glass-border-subtle)" }}>{s}</span>
          ))}
        </div>
      )}
    </article>
  );
}
