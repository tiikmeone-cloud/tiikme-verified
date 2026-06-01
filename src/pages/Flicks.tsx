import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Check, Eye, ChevronUp, ChevronDown, Loader2, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import AvatarSquare from "@/components/ui/AvatarSquare";
import VerifiedBadge from "@/components/VerifiedBadge";

interface Flick {
  id: string;
  image_url: string;
  width: number | null;
  height: number | null;
  blurhash: string | null;
  alt_text: string | null;
  like_count: number;
  view_count: number;
  created_at: string;
  author_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  liked_by_me: boolean;
  followed_by_me: boolean;
}

const PAGE_SIZE = 10;

function HeartBurst({ onEnd }: { onEnd: () => void }) {
  useEffect(() => {
    const t = setTimeout(onEnd, 700);
    return () => clearTimeout(t);
  }, [onEnd]);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 20 }}>
      <Heart style={{ width: 80, height: 80, fill: "#FF453A", color: "#FF453A", animation: "heartPop 0.6s cubic-bezier(0.17,0.89,0.32,1.28) forwards" }} />
    </div>
  );
}

function FlickCard({
  flick, onLike, onFollow,
}: {
  flick: Flick;
  onLike: (id: string, liked: boolean) => void;
  onFollow: (authorId: string, followed: boolean) => void;
}) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(flick.liked_by_me);
  const [likeCount, setLikeCount] = useState(flick.like_count);
  const [followed, setFollowed] = useState(flick.followed_by_me);
  const [heartBurst, setHeartBurst] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const viewTracked = useRef(false);
  const viewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !user) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6 && !viewTracked.current) {
          viewTimer.current = setTimeout(() => {
            if (!viewTracked.current) {
              viewTracked.current = true;
              (supabase.rpc("record_flick_view" as any, { p_flick_id: flick.id }) as any).catch(() => {});
            }
          }, 1000);
        } else {
          if (viewTimer.current) { clearTimeout(viewTimer.current); viewTimer.current = null; }
        }
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => { io.disconnect(); if (viewTimer.current) clearTimeout(viewTimer.current); };
  }, [flick.id, user]);

  const doLike = useCallback(async () => {
    if (!user) { toast.error("Sign in to like"); return; }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(c => wasLiked ? Math.max(0, c - 1) : c + 1);
    if (!wasLiked) setHeartBurst(true);
    if (wasLiked) {
      await (supabase.from("flick_likes" as any).delete().eq("flick_id", flick.id).eq("user_id", user.id) as any);
    } else {
      await (supabase.from("flick_likes" as any).insert({ flick_id: flick.id, user_id: user.id }) as any);
    }
    onLike(flick.id, !wasLiked);
  }, [user, liked, flick.id, onLike]);

  const lastTap = useRef(0);
  const handleImageTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 350) {
      if (!liked) doLike();
      else setHeartBurst(true);
    }
    lastTap.current = now;
  }, [liked, doLike]);

  const handleFollow = async () => {
    if (!user) { toast.error("Sign in to follow"); return; }
    const wasFollowed = followed;
    setFollowed(!wasFollowed);
    if (wasFollowed) {
      await (supabase.from("user_follows" as any).delete().eq("follower_id", user.id).eq("following_id", flick.author_id) as any);
      toast.success(`Unfollowed ${flick.full_name || flick.username || "user"}`);
    } else {
      await (supabase.from("user_follows" as any).insert({ follower_id: user.id, following_id: flick.author_id }) as any);
      toast.success(`Following ${flick.full_name || flick.username || "user"}`);
    }
    onFollow(flick.author_id, !wasFollowed);
  };

  const name = flick.full_name || flick.username || "User";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "U";
  const isOwn = user?.id === flick.author_id;
  const fmtCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div
      ref={cardRef}
      style={{ position: "relative", width: "100%", height: "100%", background: "#000", overflow: "hidden", borderRadius: "inherit" }}
    >
      {/* Image */}
      <img
        src={flick.image_url}
        alt={flick.alt_text || ""}
        loading="lazy"
        onClick={handleImageTap}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
      />
      {heartBurst && <HeartBurst onEnd={() => setHeartBurst(false)} />}

      {/* Bottom gradient */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.08) 50%, transparent 100%)", pointerEvents: "none" }} />

      {/* Creator strip */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 16px 20px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Link to={`/app/profile/${flick.author_id}`} style={{ flexShrink: 0 }}>
            <AvatarSquare src={flick.avatar_url || null} initials={initials} size={40} radius={10} />
          </Link>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Link to={`/app/profile/${flick.author_id}`} style={{ textDecoration: "none" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{name}</span>
              </Link>
              {flick.is_verified && <VerifiedBadge size={14} />}
            </div>
            {flick.username && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>@{flick.username}</span>
            )}
          </div>
        </div>

        {!isOwn && (
          <button
            type="button"
            onClick={handleFollow}
            aria-label={followed ? "Following" : "Follow"}
            style={followed ? {
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              border: "none", cursor: "pointer",
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
            } : {
              height: 34, padding: "0 18px", borderRadius: 999, flexShrink: 0,
              fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #FF8A3D 0%, #FF5C00 100%)",
              color: "#fff",
              boxShadow: "0 5px 14px rgba(255,92,0,0.42), inset 0 1px 0 rgba(255,255,255,0.45)",
            }}
          >
            {followed
              ? <Check style={{ width: 16, height: 16, color: "#fff" }} />
              : "Follow"
            }
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Right action rail (like + view) — used by both layouts ── */
function ActionRail({ flick, liked, likeCount, onLike }: { flick: Flick; liked: boolean; likeCount: number; onLike: () => void }) {
  const fmtCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <button type="button" onClick={onLike} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer" }}>
        <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Heart style={{ width: 22, height: 22, fill: liked ? "#FF453A" : "none", color: liked ? "#FF453A" : "#fff", transition: "all 200ms" }} />
        </div>
        {likeCount > 0 && <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{fmtCount(likeCount)}</span>}
      </button>
      {flick.view_count > 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Eye style={{ width: 20, height: 20, color: "#fff" }} />
          </div>
          <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{fmtCount(flick.view_count)}</span>
        </div>
      )}
    </div>
  );
}

export default function Flicks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [flicks, setFlicks] = useState<Flick[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  // Per-card like state for desktop rail
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<string | null>(null);

  const fetchFlicks = useCallback(async (cursor: string | null = null) => {
    const args: Record<string, unknown> = { p_limit: PAGE_SIZE };
    if (cursor) args.p_cursor = cursor;
    const { data, error } = await (supabase.rpc("get_flicks_feed" as any, args) as any);
    if (error) { toast.error("Couldn't load Flicks"); return []; }
    return (data || []) as Flick[];
  }, []);

  useEffect(() => {
    (async () => {
      const data = await fetchFlicks(null);
      setFlicks(data);
      const lm: Record<string, boolean> = {};
      const lcm: Record<string, number> = {};
      data.forEach((f: Flick) => { lm[f.id] = f.liked_by_me; lcm[f.id] = f.like_count; });
      setLikedMap(lm);
      setLikeCountMap(lcm);
      if (data.length > 0) cursorRef.current = data[data.length - 1].created_at;
      setHasMore(data.length === PAGE_SIZE);
      setLoading(false);
    })();
  }, [fetchFlicks]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const data = await fetchFlicks(cursorRef.current);
    if (data.length > 0) {
      setFlicks(prev => [...prev, ...data]);
      const lm = { ...likedMap };
      const lcm = { ...likeCountMap };
      data.forEach((f: Flick) => { lm[f.id] = f.liked_by_me; lcm[f.id] = f.like_count; });
      setLikedMap(lm);
      setLikeCountMap(lcm);
      cursorRef.current = data[data.length - 1].created_at;
    }
    setHasMore(data.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [loadingMore, hasMore, fetchFlicks, likedMap, likeCountMap]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActiveIdx(idx);
      if (idx >= flicks.length - 3) loadMore();
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [flicks.length, loadMore]);

  const goTo = (idx: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * el.clientHeight, behavior: "smooth" });
  };

  const handleLike = useCallback(async (flickId: string) => {
    if (!user) { toast.error("Sign in to like"); return; }
    const wasLiked = likedMap[flickId] ?? false;
    setLikedMap(m => ({ ...m, [flickId]: !wasLiked }));
    setLikeCountMap(m => ({ ...m, [flickId]: Math.max(0, (m[flickId] ?? 0) + (wasLiked ? -1 : 1)) }));
    if (wasLiked) {
      await (supabase.from("flick_likes" as any).delete().eq("flick_id", flickId).eq("user_id", user.id) as any);
    } else {
      await (supabase.from("flick_likes" as any).insert({ flick_id: flickId, user_id: user.id }) as any);
    }
  }, [user, likedMap]);

  const activeFlick = flicks[activeIdx];
  const ambientUrl = activeFlick?.image_url;

  if (loading) return (
    <div className="flicks-viewport" style={{ background: "#0B0B0D", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 style={{ width: 32, height: 32, color: "#FF5A1F", animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (flicks.length === 0) return (
    <div className="flicks-viewport" style={{ background: "var(--bg-page)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,90,31,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ImagePlus style={{ width: 32, height: 32, color: "#FF5A1F" }} />
      </div>
      <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>No Flicks yet</p>
      <p style={{ fontSize: 14, color: "var(--text-3)", textAlign: "center" }}>Be the first to post one.</p>
      <button type="button" onClick={() => navigate("/flick/create")} className="cursor-pointer active:scale-[0.97]"
        style={{ padding: "10px 24px", borderRadius: 999, background: "#FF5A1F", color: "#fff", fontWeight: 600, fontSize: 14, border: "none" }}>
        Post a Flick
      </button>
    </div>
  );

  return (
    <div className="flicks-viewport" style={{ position: "relative", background: "#0B0B0D" }}>

      {/* ── MOBILE layout (< md) — full-bleed 9:16 snap scroll ── */}
      <div className="md:hidden" style={{ position: "relative", width: "100%", height: "100%" }}>
        <div
          ref={containerRef}
          style={{ width: "100%", height: "100%", overflowY: "scroll", scrollSnapType: "y mandatory", scrollbarWidth: "none" }}
        >
          {flicks.map(flick => (
            <div key={flick.id} style={{ width: "100%", height: "100%", scrollSnapAlign: "start", flexShrink: 0 }}>
              <FlickCard flick={flick} onLike={() => {}} onFollow={() => {}} />
            </div>
          ))}
          {loadingMore && (
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
              <Loader2 style={{ width: 24, height: 24, color: "#FF5A1F", animation: "spin 1s linear infinite" }} />
            </div>
          )}
        </div>
        {/* Counter pill */}
        <div style={{ position: "absolute", top: 64, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.50)", borderRadius: 999, padding: "4px 12px", zIndex: 10, pointerEvents: "none" }}>
          <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{activeIdx + 1} / {flicks.length}</span>
        </div>
        {/* Mobile dots */}
        <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 4, zIndex: 10 }}>
          {flicks.slice(Math.max(0, activeIdx - 2), activeIdx + 5).map((_, i) => {
            const realIdx = Math.max(0, activeIdx - 2) + i;
            return (
              <div key={realIdx} onClick={() => goTo(realIdx)}
                style={{ width: realIdx === activeIdx ? 6 : 4, height: realIdx === activeIdx ? 6 : 4, borderRadius: 999, background: realIdx === activeIdx ? "#FF5A1F" : "rgba(255,255,255,0.40)", transition: "all 200ms", cursor: "pointer" }}
              />
            );
          })}
        </div>
      </div>

      {/* ── DESKTOP layout (≥ md) — theater mode ── */}
      <div className="hidden md:flex" style={{ position: "relative", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", gap: 20 }}>

        {/* Ambient blur backdrop */}
        {ambientUrl && (
          <div
            key={ambientUrl}
            style={{
              position: "absolute", inset: 0, zIndex: 0,
              backgroundImage: `url(${ambientUrl})`,
              backgroundSize: "cover", backgroundPosition: "center",
              filter: "blur(60px) brightness(0.45)",
              transition: "background-image 600ms ease",
            }}
          />
        )}
        {/* Radial vignette over ambient */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "radial-gradient(ellipse at center, transparent 30%, #0B0B0D 100%)", pointerEvents: "none" }} />

        {/* Left nav circles */}
        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", gap: 10 }}>
          <button type="button" onClick={() => goTo(Math.max(0, activeIdx - 1))} disabled={activeIdx === 0}
            style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: activeIdx === 0 ? "not-allowed" : "pointer", opacity: activeIdx === 0 ? 0.3 : 1 }}>
            <ChevronUp style={{ width: 20, height: 20, color: "#fff" }} />
          </button>
          <button type="button" onClick={() => goTo(Math.min(flicks.length - 1, activeIdx + 1))} disabled={activeIdx >= flicks.length - 1}
            style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: activeIdx >= flicks.length - 1 ? "not-allowed" : "pointer", opacity: activeIdx >= flicks.length - 1 ? 0.3 : 1 }}>
            <ChevronDown style={{ width: 20, height: 20, color: "#fff" }} />
          </button>
        </div>

        {/* Theater card */}
        <div
          ref={containerRef}
          style={{
            position: "relative", zIndex: 10,
            height: "min(86dvh, calc(100dvh - 60px))",
            aspectRatio: "9 / 16",
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 24px 70px rgba(0,0,0,0.55)",
            overflowY: "scroll",
            scrollSnapType: "y mandatory",
            scrollbarWidth: "none",
          }}
        >
          {flicks.map(flick => (
            <div key={flick.id} style={{ width: "100%", height: "100%", scrollSnapAlign: "start", flexShrink: 0 }}>
              <FlickCard flick={flick} onLike={() => {}} onFollow={() => {}} />
            </div>
          ))}
          {loadingMore && (
            <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
              <Loader2 style={{ width: 24, height: 24, color: "#FF5A1F", animation: "spin 1s linear infinite" }} />
            </div>
          )}
        </div>

        {/* Right glass action rail */}
        {activeFlick && (
          <div style={{ position: "relative", zIndex: 10 }}>
            <ActionRail
              flick={activeFlick}
              liked={likedMap[activeFlick.id] ?? activeFlick.liked_by_me}
              likeCount={likeCountMap[activeFlick.id] ?? activeFlick.like_count}
              onLike={() => handleLike(activeFlick.id)}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes heartPop {
          0%   { opacity: 0; transform: scale(0.3); }
          50%  { opacity: 1; transform: scale(1.2); }
          80%  { transform: scale(0.9); }
          100% { opacity: 0; transform: scale(1.0); }
        }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
