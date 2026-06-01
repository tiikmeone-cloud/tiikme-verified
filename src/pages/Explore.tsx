import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, X, AlertCircle } from "lucide-react";
import { cleanUsername } from "@/lib/cleanUsername";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sendNotification } from "@/lib/notify";
import type { ReactNode } from "react";
import AvatarSquare from "@/components/ui/AvatarSquare";
import { getOrgTypeConfig, isCreatorOrg } from "@/lib/orgTypes";
import { sendConnectionRequest } from "@/hooks/useConnectionStatus";
import { PageSEO } from "@/hooks/usePageSEO";
import { FollowIconButton } from "@/components/shared/FollowIconButton";

/* ─────────── Helpers ─────────── */
const HASHTAG_RE = /#([\p{L}0-9_]{2,40})/gu;
const lower = (s?: string | null) => (s || "").toLowerCase();
const overlap = (a: string[], b: string[]) => {
  if (!a.length || !b.length) return false;
  const A = new Set(a.map(lower));
  return b.some(x => A.has(lower(x)));
};

type SectionKey = "people" | "orgs" | "posts" | "hashtags";
const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "people", label: "People" },
  { key: "orgs", label: "Organizations" },
  { key: "posts", label: "Top Posts" },
  { key: "hashtags", label: "Hashtags" },
];

/* ─────────── Grid card components ─────────── */

const trunc = (s: string, max: number) => s.length > max ? s.slice(0, max - 1) + "…" : s;
const fmtCount = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

const PersonGridCard = ({
  p, strandStatus, onStrand, isFollowing, onFollow, onUnfollow, currentUserId, mutualFollowers,
}: {
  p: any; strandStatus: string; onStrand: () => void;
  isFollowing: boolean; onFollow: () => void; onUnfollow: () => void;
  currentUserId?: string; mutualFollowers?: { id: string; avatar_url: string | null; full_name: string | null }[];
}) => {
  const navigate = useNavigate();
  const isConnected = strandStatus === "accepted";
  const isPending = strandStatus === "pending";
  const rawName = p.full_name || p.username || "User";
  const name = trunc(rawName, 28);
  const rolePart = p.role ? p.role.charAt(0).toUpperCase() + p.role.slice(1).replace(/_/g, " ") : "";
  const sub = trunc([p.designation || rolePart, p.location_city].filter(Boolean).join(" · "), 40);
  const blurb = p.headline || (p.bio ? p.bio.split(/[.\n]/)[0].trim() : "") || (rolePart && p.location_city ? `${rolePart} in ${p.location_city}.` : "") || "Verified professional on Tiikme.";
  const followerCount: number = p.follower_count ?? 0;
  const mutuals = mutualFollowers || [];

  return (
    <article
      className="glass-card"
      style={{
        height: 214, display: "flex", flexDirection: "column",
        padding: "14px 14px 11px", borderRadius: 14,
        transition: "transform 180ms, box-shadow 180ms",
        overflow: "hidden", boxSizing: "border-box",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(26,26,78,0.10)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => navigate(`/app/profile/${p.id}`)}>
          <AvatarSquare src={p.avatar_url} name={name} size={44} style={{ borderRadius: "50%" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => navigate(`/app/profile/${p.id}`)}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: "17px" }}>
            {name}
            {p.is_verified && (
              <span style={{ display: "inline-flex", width: 13, height: 13, marginLeft: 4, verticalAlign: "middle", background: "#FF5A1F", borderRadius: "50%", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 10 8" fill="none" style={{ width: 7, height: 7 }}><path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            )}
          </p>
          {sub && <p style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{sub}</p>}
        </div>
        {currentUserId !== p.id && (
          <FollowIconButton isFollowing={isFollowing} onFollow={onFollow} onUnfollow={onUnfollow} targetName={name} size={28} />
        )}
      </div>

      {/* Blurb — always present, 2-line clamp */}
      <p style={{
        fontSize: 12, color: "var(--text-secondary)", marginTop: 8, lineHeight: "16px",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        overflow: "hidden", overflowWrap: "anywhere",
      }}>
        {blurb}
      </p>

      <div style={{ flex: 1 }} />

      {/* Bottom row: follower avatars OR "New here" + connect button */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        {/* Follower DP row */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 4, overflow: "hidden" }}>
          {followerCount === 0 ? (
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", background: "var(--surface-2)", borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap" }}>New here</span>
          ) : (
            <>
              {/* Overlapping avatar stack: mutuals first, then fill with follower count */}
              <div style={{ display: "flex", alignItems: "center" }}>
                {mutuals.slice(0, 3).map((m, i) => (
                  <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -7, zIndex: 3 - i, position: "relative", borderRadius: "50%", border: "1.5px solid var(--bg-card)", flexShrink: 0 }}>
                    <AvatarSquare src={m.avatar_url} name={m.full_name || "?"} size={18} style={{ borderRadius: "50%", display: "block" }} />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {mutuals.length > 0 ? `${mutuals.length} mutual · ` : ""}{fmtCount(followerCount)} follower{followerCount !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </div>

        {/* Connect button */}
        {currentUserId !== p.id && (
          <button
            type="button"
            disabled={strandStatus !== "none"}
            onClick={e => { e.stopPropagation(); onStrand(); }}
            className="cursor-pointer"
            style={{
              flexShrink: 0, height: 26, padding: "0 10px", borderRadius: 7, fontSize: 11, fontWeight: 600,
              border: "none", whiteSpace: "nowrap",
              ...(isConnected
                ? { background: "rgba(52,199,89,0.10)", color: "#34C759" }
                : isPending
                ? { background: "rgba(255,90,31,0.08)", color: "#FF5A1F" }
                : { background: "#FF5A1F", color: "#fff" }
              ),
            }}
          >
            {isConnected ? "✓ Connected" : isPending ? "Requested" : "Connect"}
          </button>
        )}
      </div>
    </article>
  );
};

const OrgGridCard = ({
  org, following, onToggleFollow, navigateTo,
}: {
  org: any; following: boolean; onToggleFollow: () => void; navigateTo: string;
}) => {
  const navigate = useNavigate();
  const subtype = org.subtype || org.sub_type;
  const audience = org.followers_count != null ? org.followers_count : null;
  const isCreator = isCreatorOrg(org.type, subtype);
  const audienceLabel = isCreator ? "subscribers" : "followers";
  const location = [org.city, org.state].filter(Boolean).join(", ");
  const blurb = org.description ? org.description.split(/[.\n]/)[0].trim() : "";
  return (
    <article
      className="glass-card"
      style={{
        height: 214, display: "flex", flexDirection: "column",
        padding: "14px 14px 11px", borderRadius: 14,
        transition: "transform 180ms, box-shadow 180ms",
        overflow: "hidden", boxSizing: "border-box",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(26,26,78,0.10)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => navigate(navigateTo)}>
          <AvatarSquare src={org.logo_url} name={org.name || "?"} size={44} style={{ borderRadius: 10 }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => navigate(navigateTo)}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: "17px" }}>
            {org.name}
          </p>
          {(subtype || location) && (
            <p style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
              {[subtype, location].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <FollowIconButton
          isFollowing={following}
          onFollow={onToggleFollow}
          onUnfollow={onToggleFollow}
          targetName={org.name}
          size={28}
        />
      </div>

      {/* Blurb */}
      {blurb && (
        <p style={{
          fontSize: 12, color: "var(--text-secondary)", marginTop: 8, lineHeight: "16px",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          overflow: "hidden", overflowWrap: "anywhere",
        }}>
          {blurb}
        </p>
      )}

      <div style={{ flex: 1 }} />

      {/* Followers count */}
      {audience != null && audience >= 0 && (
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
          <span className="num">{fmtCount(audience)}</span> {audienceLabel}
        </p>
      )}
    </article>
  );
};

/* PostCarouselCard fixed-size wrapper: 200×220px */
const PostCarouselCard = ({ post, authorProfile }: { post: any; authorProfile?: any }) => {
  const navigate = useNavigate();
  const name = authorProfile?.full_name || "User";
  const reactionTotal = (post.reactions?.useful || 0) + (post.reactions?.inspiring || 0) + (post.reactions?.insightful || 0) + (post.reactions?.like || 0);
  const timeAgo = (() => {
    const diff = Date.now() - new Date(post.created_at).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}m`;
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  })();
  return (
    <article
      className="glass-card cursor-pointer"
      style={{
        width: 200, minWidth: 200, height: 220, flexShrink: 0,
        display: "flex", flexDirection: "column",
        padding: "12px", borderRadius: 14,
        scrollSnapAlign: "start",
        transition: "transform 200ms, box-shadow 200ms",
        boxSizing: "border-box", overflow: "hidden",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(26,26,78,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
      onClick={() => navigate(`/app/feed?post=${post.id}`)}
    >
      <div className="flex items-center" style={{ gap: 6, marginBottom: 8 }}>
        <AvatarSquare src={authorProfile?.avatar_url} name={name} size={26} style={{ borderRadius: "50%", flexShrink: 0 }} />
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
        <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>{timeAgo}</span>
      </div>
      <p style={{ fontSize: 12, lineHeight: "17px", color: "var(--text-secondary)", flex: 1, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {post.content}
      </p>
      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
        <span className="num">{reactionTotal}</span> likes · <span className="num">{post.comment_count || 0}</span> comments
      </p>
    </article>
  );
};

/* HashtagCarouselCard fixed-size: 160×100px */
const HashtagCarouselCard = ({ tag, count, onClick }: { tag: string; count: number; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      width: 160, minWidth: 160, height: 100, flexShrink: 0,
      display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center",
      padding: "0 16px", borderRadius: 14,
      scrollSnapAlign: "start",
      cursor: "pointer", background: "var(--bg-card)", border: "1px solid var(--border-glass)",
      transition: "transform 150ms, box-shadow 150ms",
      boxSizing: "border-box",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(26,26,78,0.10)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
  >
    <p style={{ fontSize: 18, fontWeight: 700, color: "#FF5A1F", lineHeight: "22px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>#{tag}</p>
    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}><span className="num">{count}</span> posts</p>
  </button>
);

/* ─────────── CarouselSection — reusable horizontal scroll section ─────────── */
const CarouselSection = ({
  sectionRef, title, count, seeAllHref, children,
}: {
  sectionRef?: (el: HTMLDivElement | null) => void;
  title: string;
  count: number;
  seeAllHref?: string;
  children: ReactNode;
}) => {
  const navigate = useNavigate();
  return (
    <div ref={sectionRef} style={{ marginBottom: 28 }}>
      {/* Section header */}
      <div className="flex items-center" style={{ marginBottom: 10 }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: "#FF5A1F", marginRight: 8, flexShrink: 0 }} />
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", flex: 1, margin: 0 }}>{title}</h2>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "#FF5A1F", borderRadius: 10, padding: "1px 8px", marginLeft: 8 }}>{count}</span>
        {seeAllHref && (
          <button
            type="button"
            onClick={() => navigate(seeAllHref)}
            className="cursor-pointer"
            style={{ marginLeft: 12, fontSize: 12, fontWeight: 600, color: "#FF5A1F", background: "none", border: "none", whiteSpace: "nowrap" }}
          >
            See all →
          </button>
        )}
      </div>
      {/* Horizontal scrollable row */}
      <div
        className="flex"
        style={{
          overflowX: "auto",
          gap: 12,
          paddingBottom: 12,
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
};

/* ─────────── GridSection — responsive grid for people + orgs ─────────── */
const GridSection = ({
  sectionRef, title, count, children,
}: {
  sectionRef?: (el: HTMLDivElement | null) => void;
  title: string;
  count: number;
  children: ReactNode;
}) => (
  <div ref={sectionRef} style={{ marginBottom: 28 }}>
    <div className="flex items-center" style={{ marginBottom: 12 }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: "#FF5A1F", marginRight: 8, flexShrink: 0 }} />
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", flex: 1, margin: 0 }}>{title}</h2>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: "#FF5A1F", borderRadius: 10, padding: "1px 8px", marginLeft: 8 }}>{count}</span>
    </div>
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 12,
    }}
      className="grid-explore"
    >
      {children}
    </div>
  </div>
);

const clampTwoLinesStyle = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical" as const,
  overflow: "hidden",
  overflowWrap: "anywhere" as const,
  wordBreak: "break-word" as const,
};


const Explore = () => {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const mountedRef = useRef(true);

  const [strandMap, setStrandMap] = useState<Record<string, string>>({});
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [userFollowMap, setUserFollowMap] = useState<Record<string, boolean>>({});
  const [mutualMap, setMutualMap] = useState<Record<string, { id: string; avatar_url: string | null; full_name: string | null }[]>>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SectionKey | null>(null);
  const [exploreMode, setExploreMode] = useState<"foryou" | "trending">("foryou");
  const [activeCategoryTag, setActiveCategoryTag] = useState<string | null>(null);

  const sectionRefs = useRef<Record<SectionKey, HTMLDivElement | null>>({
    people: null, orgs: null, posts: null, hashtags: null,
  });

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  /* ─────────── Search (debounced) — also dedupes people the viewer
   *  has already requested or connected with, using the live strandMap. */
  useEffect(() => {
    if (search.trim().length < 2) { setSearchResults([]); setShowSearchResults(false); return; }
    const t = setTimeout(async () => {
      const term = `%${search}%`;
      const [{ data: profiles }, { data: orgs }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, avatar_url, role")
          .eq("is_public", true).neq("id", user?.id || "")
          .or(`full_name.ilike.${term},username.ilike.${term}`).limit(8),
        supabase.from("organizations").select("id, name, slug, type, subtype, logo_url")
          .or(`name.ilike.${term}`).limit(5),
      ]);
      const results: any[] = [];
      (profiles || []).forEach(p => {
        const st = strandMap[p.id];
        if (st === "accepted" || st === "pending") return;   // dedupe
        results.push({ ...p, kind: "person" });
      });
      (orgs || []).forEach(o => results.push({ ...o, kind: "org" }));
      if (mountedRef.current) { setSearchResults(results.slice(0, 8)); setShowSearchResults(true); }
    }, 300);
    return () => clearTimeout(t);
  }, [search, user?.id, strandMap]);

  /* ─────────── Profile signals ─────────── */
  const viewerInterests = useMemo(() => {
    const set = new Set<string>();
    ((profile as any)?.interests || []).forEach((i: string) => i && set.add(lower(i)));
    ((profile as any)?.skills || []).forEach((s: string) => s && set.add(lower(s)));
    if (profile?.sector) set.add(lower(profile.sector));
    return Array.from(set);
  }, [profile]);

  const profileIncomplete = !profile?.role && !profile?.location_city && viewerInterests.length === 0;

  /* ─────────── Unified fetch ─────────── */
  const fetchAll = useCallback(async () => {
    if (!user) return null;
    try {

    /* strands → exclusion + status map */
    const { data: strands } = await supabase
      .from("strands")
      .select("requester_id, receiver_id, status")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    const sMap: Record<string, string> = {};
    const excluded = new Set<string>([user.id]);
    (strands || []).forEach((s: any) => {
      const otherId = s.requester_id === user.id ? s.receiver_id : s.requester_id;
      if (!otherId) return;
      sMap[otherId] = s.status || "pending";
      if (s.status === "accepted" || s.status === "pending") excluded.add(otherId);
    });
    const connectedIds = new Set<string>(
      (strands || []).filter((s: any) => s.status === "accepted")
        .map((s: any) => s.requester_id === user.id ? s.receiver_id : s.requester_id)
        .filter(Boolean)
    );

    /* org follows — institution accounts use org_follows (org→org), others use org_followers (user→org) */
    const isInstitutionViewer = profile?.account_type === "institution";
    const viewerOrgIdForFollows = (profile as any)?.org_id;
    const followsRes = isInstitutionViewer && viewerOrgIdForFollows
      ? await (supabase.from("org_follows" as any).select("following_org_id").eq("follower_org_id", viewerOrgIdForFollows) as any)
      : await supabase.from("org_followers").select("org_id").eq("user_id", user.id);
    const fMap: Record<string, boolean> = {};
    (followsRes.data || []).forEach((f: any) => {
      const id = f.following_org_id || f.org_id;
      if (id) fMap[id] = true;
    });
    /* ─── PEOPLE (relevance filtered, backfill with top activity) ─── */
    const { data: peopleRaw } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url, role, role_subtype, headline, bio, designation, institution_name, currently_working_at, display_preference, location_city, is_verified, activity_score, follower_count, privacy, sector, skills, interests, role_metadata, account_type, profession_type")
      .eq("is_public", true)
      .not("full_name", "is", null)
      .neq("id", user.id)
      .order("activity_score", { ascending: false, nullsFirst: false })
      .limit(120);

    const peopleSafe = (peopleRaw || []).filter((p: any) => {
      const priv = (p as any).privacy as any;
      if (priv && priv.show_in_explore === false) return false;
      return !excluded.has(p.id);
    });

    const viewerProfType = (profile as any)?.profession_type;
    const matchedPeople = peopleSafe.filter((p: any) => {
      const sameProfType = viewerProfType && p.profession_type && p.profession_type === viewerProfType;
      const sameRole = profile?.role && (p.role === profile.role || (p.role_subtype && p.role_subtype === profile.role_subtype));
      const sameCity = profile?.location_city && lower(p.location_city) === lower(profile.location_city);
      const tagMatch = overlap(viewerInterests, [...(p.skills || []), ...(p.interests || []), p.sector].filter(Boolean) as string[]);
      const sameAccountType = !profile?.role && profile?.account_type && p.account_type === profile.account_type;
      return sameProfType || sameRole || sameCity || tagMatch || sameAccountType;
    });

    /* backfill so the carousel never feels dead */
    const peopleSet = new Set(matchedPeople.map((p: any) => p.id));
    const backfill = peopleSafe.filter((p: any) => !peopleSet.has(p.id)).slice(0, Math.max(0, 20 - matchedPeople.length));
    const people = [...matchedPeople, ...backfill].slice(0, 20);

    /* ─── ORGS (top by followers, exclude already followed) ─── */
    const { data: orgsRaw } = await supabase
      .from("organizations")
      .select("id, name, slug, type, subtype, logo_url, city, state, followers_count, created_by, created_at, description")
      .order("followers_count", { ascending: false, nullsFirst: false })
      .limit(40);
    const orgs = (orgsRaw || []).filter((o: any) => !fMap[o.id]).slice(0, 10);

    /* ─── TOP POSTS (interest-tag overlap or from connections, < 48h) ─── */
    const twoDaysAgo = new Date(Date.now() - 48 * 3600000).toISOString();
    const { data: postsRaw } = await supabase
      .from("posts")
      .select("id, content, author_id, reactions, comment_count, created_at, image_urls, hashtags")
      .gte("created_at", twoDaysAgo)
      .eq("visibility", "everyone")
      .order("created_at", { ascending: false })
      .limit(80);

    const scoredPosts = (postsRaw || [])
      .map((p: any) => {
        const r = (p.reactions || {}) as Record<string, number>;
        const reactionCount = (r.useful || 0) + (r.inspiring || 0) + (r.insightful || 0) + (r.like || 0);
        const interestMatch = overlap(viewerInterests, p.hashtags || []);
        const fromConnection = connectedIds.has(p.author_id);
        return { ...p, _engagement: reactionCount + (p.comment_count || 0), _relevant: interestMatch || fromConnection };
      })
      .filter((p: any) => p._relevant || p._engagement > 0);

    scoredPosts.sort((a: any, b: any) => {
      if (a._relevant !== b._relevant) return a._relevant ? -1 : 1;
      return b._engagement - a._engagement;
    });
    const posts = scoredPosts.slice(0, 5);

    const authorIds = [...new Set(posts.map((p: any) => p.author_id).filter(Boolean))];
    const postAuthors: Record<string, any> = {};
    if (authorIds.length) {
      const { data: authors } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", authorIds);
      (authors || []).forEach((a: any) => { postAuthors[a.id] = a; });
    }

    /* ─── TRENDING HASHTAGS (last 7 days) ─── */
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
    const { data: feedTags } = await supabase.from("posts").select("hashtags").gte("created_at", sevenDaysAgo).limit(500);
    const tagCount: Record<string, number> = {};
    (feedTags || []).forEach((row: any) => {
      (row.hashtags || []).forEach((h: string) => {
        const k = lower(h).replace(/^#/, "");
        if (k) tagCount[k] = (tagCount[k] || 0) + 1;
      });
    });
    const hashtags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    /* ─── USER FOLLOWS + MUTUAL FOLLOWER MAP ─── */
    const ufMap: Record<string, boolean> = {};
    const mMap: Record<string, { id: string; avatar_url: string | null; full_name: string | null }[]> = {};
    try {
      const { data: userFollows } = await supabase
        .from("user_follows" as any)
        .select("following_id")
        .eq("follower_id", user.id) as any;
      (userFollows || []).forEach((f: any) => { if (f.following_id) ufMap[f.following_id] = true; });

      const followedByViewer = Object.keys(ufMap);
      const peopleIds = people.map((p: any) => p.id);
      if (followedByViewer.length > 0 && peopleIds.length > 0) {
        const { data: mutualRows } = await supabase
          .from("user_follows" as any)
          .select("follower_id, following_id")
          .in("follower_id", followedByViewer)
          .in("following_id", peopleIds) as any;

        const byTarget: Record<string, string[]> = {};
        (mutualRows || []).forEach((r: any) => {
          if (!byTarget[r.following_id]) byTarget[r.following_id] = [];
          byTarget[r.following_id].push(r.follower_id);
        });

        const mutualIds = [...new Set(Object.values(byTarget).flat())];
        if (mutualIds.length > 0) {
          const { data: mProfiles } = await supabase
            .from("profiles").select("id, avatar_url, full_name").in("id", mutualIds);
          const byId: Record<string, any> = {};
          (mProfiles || []).forEach((p: any) => { byId[p.id] = p; });
          Object.entries(byTarget).forEach(([tid, ids]) => {
            mMap[tid] = ids.map(id => byId[id]).filter(Boolean).slice(0, 3);
          });
        }
      }
    } catch { /* user_follows may be empty */ }

    return { sMap, fMap, ufMap, mMap, people, orgs, posts, postAuthors, hashtags };
    } catch (err) {
      console.error("[Explore] fetchAll error:", err);
      return { sMap: {}, fMap: {}, ufMap: {}, mMap: {}, people: [], orgs: [], posts: [], postAuthors: {}, hashtags: [] };
    }
  }, [user?.id, profile?.role, profile?.role_subtype, profile?.location_city, profile?.sector, profile?.account_type, (profile as any)?.profession_type, viewerInterests.join(",")]);

  const { data: exploreData, isLoading } = useQuery({
    queryKey: ["explore-sectioned", user?.id, (profile as any)?.profession_type],
    queryFn: fetchAll,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (exploreData) {
      setStrandMap(exploreData.sMap);
      setFollowMap(exploreData.fMap);
      setUserFollowMap(exploreData.ufMap);
      setMutualMap(exploreData.mMap);
    }
  }, [exploreData]);

  /* ─────────── Actions ─────────── */
  const handleStrand = async (personId: string) => {
    if (!user) return;
    // Optimistic: drop the card from People you may know immediately so
    // the list never re-shows someone we just requested.
    qc.setQueryData(["explore-sectioned", user.id], (old: any) =>
      old ? { ...old, people: (old.people || []).filter((p: any) => p.id !== personId) } : old
    );
    setStrandMap(prev => ({ ...prev, [personId]: "pending" }));
    const result = await sendConnectionRequest(user.id, personId, profile?.full_name || "Someone");
    if (result === null) {
      // request already existed — keep the card hidden, don't roll back
      return;
    }
    setStrandMap(prev => ({ ...prev, [personId]: result }));
    toast.success(result === "accepted" ? "Connected!" : "Request sent");
  };

  const handleUserFollow = async (personId: string, name: string) => {
    if (!user) return;
    if (userFollowMap[personId]) {
      setUserFollowMap(prev => ({ ...prev, [personId]: false }));
      try {
        await (supabase.from("user_follows" as any).delete().eq("follower_id", user.id).eq("following_id", personId) as any);
      } catch { setUserFollowMap(prev => ({ ...prev, [personId]: true })); }
    } else {
      setUserFollowMap(prev => ({ ...prev, [personId]: true }));
      try {
        await (supabase.from("user_follows" as any).insert({ follower_id: user.id, following_id: personId }) as any);
        sendNotification({ userId: personId, actorId: user.id, type: "follow", title: `${profile?.full_name || "Someone"} started following you`, actionUrl: `/app/profile/${user.id}` });
      } catch { setUserFollowMap(prev => ({ ...prev, [personId]: false })); }
    }
  };

  const toggleFollow = async (orgId: string, createdBy?: string) => {
    if (!user) return;
    const isInstitution = profile?.account_type === "institution";
    const viewerOrgId = (profile as any)?.org_id;
    if (followMap[orgId]) {
      if (isInstitution && viewerOrgId) {
        await (supabase.from("org_follows" as any).delete().eq("follower_org_id", viewerOrgId).eq("following_org_id", orgId) as any);
      } else {
        await supabase.from("org_followers").delete().eq("org_id", orgId).eq("user_id", user.id);
      }
      setFollowMap(prev => ({ ...prev, [orgId]: false }));
    } else {
      if (isInstitution && viewerOrgId) {
        await (supabase.from("org_follows" as any).insert({ follower_org_id: viewerOrgId, following_org_id: orgId }) as any);
      } else {
        await supabase.from("org_followers").insert({ org_id: orgId, user_id: user.id });
      }
      setFollowMap(prev => ({ ...prev, [orgId]: true }));
      if (createdBy) {
        sendNotification({
          userId: createdBy, actorId: user.id, type: "follow",
          title: `${isInstitution ? (profile as any)?.institution_name || "An organisation" : profile?.full_name || "Someone"} started following your organization`,
          actionUrl: `/app/explore`,
        });
      }
    }
  };

  const toggleSectionFilter = (k: SectionKey) => {
    setActiveFilter(prev => {
      const next = prev === k ? null : k;
      if (next) {
        requestAnimationFrame(() => {
          sectionRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return next;
    });
  };

  const getOrgNavigateTo = (org: any) => org.slug ? `/org/${org.slug}` : "#";

  const displayedPosts = useMemo(() => {
    if (!exploreData) return [];
    let pts = exploreData.posts as any[];
    if (activeCategoryTag) {
      pts = pts.filter((p: any) =>
        (p.hashtags || []).some((h: string) => lower(h).replace(/^#/, "") === activeCategoryTag)
      );
    }
    if (exploreMode === "trending") {
      pts = [...pts].sort((a: any, b: any) => (b._engagement || 0) - (a._engagement || 0));
    }
    return pts;
  }, [exploreData, activeCategoryTag, exploreMode]);

  const showPeople = (exploreData?.people.length ?? 0) > 0;
  const showOrgs = (exploreData?.orgs.length ?? 0) > 0;
  const showHashtags = (exploreData?.hashtags.length ?? 0) > 0;
  const anyContent = showPeople || showOrgs || displayedPosts.length > 0 || showHashtags;

  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 pt-4 pb-24 md:pb-12">
      <PageSEO
        title="Explore Verified Professionals & Organizations | Tiikme"
        description="Discover verified professionals, organizations, and trending opportunities on Tiikme — India's professional identity network."
        canonical="https://tiikme.com/app/explore"
        ogType="website"
        twitterCard="summary_large_image"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SearchResultsPage",
          name: "Explore | Tiikme",
          description: "Discover verified professionals and organizations on Tiikme",
          url: "https://tiikme.com/app/explore",
          isPartOf: { "@type": "WebSite", name: "Tiikme", url: "https://tiikme.com" },
        }}
      />
      {/* Sticky top bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--bg-base)", paddingBottom: 12 }}>
        {/* Search */}
        <div className="relative">
          <Search className="absolute" style={{ left: 16, top: "50%", transform: "translateY(-50%)", width: 20, height: 20, color: "var(--text-muted)" }} />
          <input type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => { setFocused(false); setShowSearchResults(false); }, 200)}
            placeholder="Search people, companies..."
            className="w-full outline-none"
            style={{
              height: 48, borderRadius: 16, paddingLeft: 48, paddingRight: 16, fontSize: 14, fontWeight: 400,
              background: "var(--bg-input, var(--surface-2))",
              border: focused ? "1px solid rgba(255,90,31,0.50)" : "1px solid var(--border-glass)",
              boxShadow: focused ? "0 0 0 3px rgba(255,90,31,0.10)" : "none",
              color: "var(--text-1)", transition: "border-color 150ms, box-shadow 150ms",
            }} />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute" style={{ right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }} aria-label="Clear search">
              <X style={{ width: 16, height: 16 }} />
            </button>
          )}

          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute w-full overflow-y-auto" style={{
              marginTop: 4, maxHeight: 320, padding: 4, borderRadius: 12, zIndex: 30,
              background: "var(--bg-card)",
              border: "1px solid var(--border-glass)",
              boxShadow: "var(--shadow-lg)",
            }}>
              {searchResults.map((r: any) => (
                <button key={r.id} type="button"
                  className="w-full flex items-start text-left"
                  style={{ gap: 10, padding: 10, borderRadius: 8, transition: "background 100ms", cursor: "pointer", background: "transparent", border: "none" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card-hover)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  onClick={() => { navigate(r.kind === "person" ? `/app/profile/${r.id}` : `/org/${r.slug}`); setShowSearchResults(false); setSearch(""); }}>
                  <AvatarSquare src={r.avatar_url || r.logo_url} name={r.full_name || r.name || "?"} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", lineHeight: "17px", ...clampTwoLinesStyle }}>{r.full_name || r.name}</p>
                    {r.kind === "person" ? (
                      <p style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)", marginTop: 2, lineHeight: "16px", ...clampTwoLinesStyle }}>@{cleanUsername(r.username) || "user"}</p>
                    ) : (() => {
                      const conf = getOrgTypeConfig(r.type);
                      return (
                        <span style={{
                          display: "inline-flex", alignItems: "center", flexWrap: "wrap", gap: 4, marginTop: 4,
                          padding: "3px 7px", borderRadius: 6,
                          fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
                          background: conf.bg, color: conf.color, textTransform: "uppercase",
                        }}>
                          {conf.label}
                          {r.subtype && <span style={{ opacity: 0.7, textTransform: "none", fontWeight: 500, maxWidth: 160, ...clampTwoLinesStyle }}>· {r.subtype}</span>}
                        </span>
                      );
                    })()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* For you / Trending toggle */}
        <div className="flex items-center" style={{ marginTop: 12, gap: 4, background: "var(--surface-2)", borderRadius: 999, padding: 3, width: "fit-content" }}>
          {(["foryou", "trending"] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setExploreMode(mode)}
              className="cursor-pointer"
              style={{
                height: 28, padding: "0 16px", borderRadius: 999, fontSize: 12, fontWeight: 600, border: "none",
                background: exploreMode === mode ? "#FF5A1F" : "transparent",
                color: exploreMode === mode ? "#fff" : "var(--text-3)",
                boxShadow: exploreMode === mode ? "0 2px 8px rgba(255,90,31,0.25)" : "none",
                transition: "all 150ms",
              }}
            >
              {mode === "foryou" ? "For you" : "Trending"}
            </button>
          ))}
        </div>

        {/* Category chips — top hashtags as content filters */}
        {(exploreData?.hashtags?.length ?? 0) > 0 && (
          <div className="flex overflow-x-auto" style={{ gap: 8, marginTop: 10, paddingBottom: 2, scrollbarWidth: "none" }}>
            <button
              type="button"
              onClick={() => setActiveCategoryTag(null)}
              className="cursor-pointer"
              style={{
                flexShrink: 0, padding: "0 14px", height: 30, borderRadius: 999, fontSize: 12, fontWeight: 600, border: "none", whiteSpace: "nowrap",
                background: activeCategoryTag === null ? "rgba(255,90,31,0.15)" : "var(--surface-2)",
                color: activeCategoryTag === null ? "#FF5A1F" : "var(--text-3)",
              }}
            >
              All
            </button>
            {exploreData!.hashtags.map(h => {
              const isActive = activeCategoryTag === h.tag;
              return (
                <button
                  key={h.tag}
                  type="button"
                  onClick={() => setActiveCategoryTag(prev => prev === h.tag ? null : h.tag)}
                  className="cursor-pointer"
                  style={{
                    flexShrink: 0, padding: "0 14px", height: 30, borderRadius: 999, fontSize: 12, fontWeight: 600, border: "none", whiteSpace: "nowrap",
                    background: isActive ? "rgba(255,90,31,0.15)" : "var(--surface-2)",
                    color: isActive ? "#FF5A1F" : "var(--text-3)",
                  }}
                >
                  #{h.tag}
                </button>
              );
            })}
          </div>
        )}

        {/* Section nav pills */}
        <div className="flex overflow-x-auto" style={{ gap: 8, marginTop: 10, paddingBottom: 4, scrollbarWidth: "none" }}>
          {SECTIONS.map(s => {
            const isActive = activeFilter === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggleSectionFilter(s.key)}
                className="cursor-pointer transition-all active:scale-95 hover:opacity-90"
                style={{
                  flexShrink: 0, padding: "0 16px", height: 32, borderRadius: 999,
                  fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
                  background: isActive ? "#FF5A1F" : "var(--surface-2)",
                  border: isActive ? "1px solid #FF5A1F" : "1px solid var(--border-glass)",
                  color: isActive ? "#FFFFFF" : "var(--text-3)",
                  boxShadow: isActive ? "0 4px 12px rgba(249,115,22,0.25)" : "none",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile-incomplete banner */}
      {profileIncomplete && !isLoading && (
        <div className="flex items-center" style={{
          gap: 12, padding: 14, marginTop: 16, borderRadius: 12,
          background: "rgba(255,90,31,0.08)", border: "1px solid rgba(255,90,31,0.20)",
        }}>
          <AlertCircle style={{ width: 20, height: 20, color: "#FF5A1F", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Complete your profile for better picks</p>
            <p style={{ fontSize: 12, fontWeight: 400, color: "var(--text-secondary)", margin: 0 }}>Add your role, city and interests to personalize Explore.</p>
          </div>
          <Link to="/app/profile" style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: "#FF5A1F", color: "#fff", textDecoration: "none", whiteSpace: "nowrap",
          }}>Edit profile</Link>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && !exploreData && (
        <div style={{ marginTop: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ marginBottom: 24 }}>
              <div style={{ height: 18, width: 160, borderRadius: 4, background: "var(--bg-card)", marginBottom: 12 }} />
              <div className="flex" style={{ gap: 10 }}>
                {[1, 2, 3, 4].map(j => (
                  <div key={j} style={{ height: 110, width: 280, flexShrink: 0, borderRadius: 12, background: "var(--bg-card)" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      <div style={{ marginTop: 18 }}>
        {showPeople && (!activeFilter || activeFilter === "people") && (
          <GridSection
            sectionRef={el => { sectionRefs.current.people = el; }}
            title="People you may know"
            count={exploreData!.people.length}
          >
            {exploreData!.people.slice(0, 20).map(p => (
              <PersonGridCard
                key={p.id}
                p={p}
                strandStatus={strandMap[p.id] || "none"}
                onStrand={() => handleStrand(p.id)}
                isFollowing={!!userFollowMap[p.id]}
                onFollow={() => handleUserFollow(p.id, p.full_name || p.username || "them")}
                onUnfollow={() => handleUserFollow(p.id, p.full_name || p.username || "them")}
                currentUserId={user?.id}
                mutualFollowers={mutualMap[p.id]}
              />
            ))}
          </GridSection>
        )}

        {showOrgs && (!activeFilter || activeFilter === "orgs") && (
          <GridSection
            sectionRef={el => { sectionRefs.current.orgs = el; }}
            title="Organizations to discover"
            count={exploreData!.orgs.length}
          >
            {exploreData!.orgs.slice(0, 10).map(o => (
              <OrgGridCard
                key={o.id}
                org={o}
                following={!!followMap[o.id]}
                onToggleFollow={() => toggleFollow(o.id, o.created_by)}
                navigateTo={getOrgNavigateTo(o)}
              />
            ))}
          </GridSection>
        )}

        {(!activeFilter || activeFilter === "posts") && displayedPosts.length > 0 && (
          <CarouselSection
            sectionRef={el => { sectionRefs.current.posts = el; }}
            title={exploreMode === "trending" ? "Trending posts" : "Top posts"}
            count={displayedPosts.length}
            seeAllHref="/app/feed"
          >
            {displayedPosts.map((p: any) => (
              <PostCarouselCard
                key={p.id}
                post={p}
                authorProfile={exploreData!.postAuthors[p.author_id]}
              />
            ))}
          </CarouselSection>
        )}

        {showHashtags && (!activeFilter || activeFilter === "hashtags") && (
          <CarouselSection
            sectionRef={el => { sectionRefs.current.hashtags = el; }}
            title="Trending hashtags"
            count={exploreData!.hashtags.length}
            seeAllHref="/app/explore?filter=hashtags"
          >
            {exploreData!.hashtags.map(h => (
              <HashtagCarouselCard
                key={h.tag}
                tag={h.tag}
                count={h.count}
                onClick={() => navigate(`/tag/${encodeURIComponent(h.tag)}`)}
              />
            ))}
          </CarouselSection>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && !anyContent && (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <Search style={{ width: 48, height: 48, margin: "0 auto 12px", color: "var(--text-muted)" }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Nothing to show yet</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Add interests or grow your network to see more.</p>
        </div>
      )}
    </main>
  );
};

export default Explore;
