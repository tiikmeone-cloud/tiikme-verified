import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, UserPlus, Share2, ChevronUp, ChevronDown, Loader2, ImagePlus } from "lucide-react";
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

function FlickCard({
  flick,
  isActive,
  onLike,
  onFollow,
}: {
  flick: Flick;
  isActive: boolean;
  onLike: (id: string, liked: boolean) => void;
  onFollow: (authorId: string, followed: boolean) => void;
}) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(flick.liked_by_me);
  const [likeCount, setLikeCount] = useState(flick.like_count);
  const [followed, setFollowed] = useState(flick.followed_by_me);
  const [likeAnim, setLikeAnim] = useState(false);
  const viewTracked = useRef(false);

  // Track unique view once active
  useEffect(() => {
    if (!isActive || viewTracked.current || !user) return;
    viewTracked.current = true;
    (supabase.rpc("record_flick_view" as any, { p_flick_id: flick.id }) as any).catch(() => {});
  }, [isActive, flick.id, user]);

  const handleLike = async () => {
    if (!user) { toast.error("Sign in to like"); return; }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount(c => wasLiked ? Math.max(0, c - 1) : c + 1);
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 400);
    if (wasLiked) {
      await (supabase.from("flick_likes" as any).delete().eq("flick_id", flick.id).eq("user_id", user.id) as any);
    } else {
      await (supabase.from("flick_likes" as any).insert({ flick_id: flick.id, user_id: user.id }) as any);
    }
    onLike(flick.id, !wasLiked);
  };

  const handleFollow = async () => {
    if (!user) { toast.error("Sign in to follow"); return; }
    const wasFollowed = followed;
    setFollowed(!wasFollowed);
    if (wasFollowed) {
      await (supabase.from("user_follows" as any).delete().eq("follower_id", user.id).eq("following_id", flick.author_id) as any);
    } else {
      await (supabase.from("user_follows" as any).insert({ follower_id: user.id, following_id: flick.author_id }) as any);
      toast.success(`Following ${flick.full_name || flick.username || "user"}`);
    }
    onFollow(flick.author_id, !wasFollowed);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/app/flicks#${flick.id}`;
    try { await navigator.clipboard.writeText(url); toast.success("Link copied!"); }
    catch { toast.error("Couldn't copy link"); }
  };

  const name = flick.full_name || flick.username || "User";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "U";
  const isOwn = user?.id === flick.author_id;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#000",
        overflow: "hidden",
        scrollSnapAlign: "start",
        flexShrink: 0,
      }}
    >
      {/* Image */}
      <img
        src={flick.image_url}
        alt={flick.alt_text || ""}
        loading="lazy"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.10) 50%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* Author info — bottom left */}
      <div style={{
        position: "absolute", bottom: 80, left: 16, right: 80,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <Link to={`/app/profile/${flick.author_id}`} style={{ flexShrink: 0 }}>
          <AvatarSquare src={flick.avatar_url || null} initials={initials} size={38} radius={10} />
        </Link>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Link to={`/app/profile/${flick.author_id}`} style={{ textDecoration: "none" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{name}</span>
            </Link>
            {flick.is_verified && <VerifiedBadge size={14} />}
          </div>
          {flick.view_count > 0 && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
              {flick.view_count.toLocaleString()} views
            </span>
          )}
        </div>
        {!isOwn && (
          <button
            type="button"
            onClick={handleFollow}
            className="cursor-pointer"
            style={{
              marginLeft: 8, height: 28, padding: "0 12px", borderRadius: 999,
              fontSize: 12, fontWeight: 600, border: "none", flexShrink: 0,
              background: followed ? "rgba(255,255,255,0.20)" : "#FF5A1F",
              color: "#fff",
            }}
          >
            {followed ? "Following" : "+ Follow"}
          </button>
        )}
      </div>

      {/* Action buttons — right side */}
      <div style={{
        position: "absolute", right: 14, bottom: 80,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
      }}>
        {/* Like */}
        <button type="button" onClick={handleLike} className="cursor-pointer" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none" }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(0,0,0,0.40)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: likeAnim ? "scale(1.3)" : "scale(1)",
            transition: "transform 200ms cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            <Heart style={{ width: 22, height: 22, fill: liked ? "#FF5A1F" : "none", color: liked ? "#FF5A1F" : "#fff" }} />
          </div>
          <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{likeCount > 0 ? likeCount.toLocaleString() : ""}</span>
        </button>

        {/* Follow (icon variant) */}
        {!isOwn && !followed && (
          <button type="button" onClick={handleFollow} className="cursor-pointer" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(0,0,0,0.40)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserPlus style={{ width: 20, height: 20, color: "#fff" }} />
            </div>
          </button>
        )}

        {/* Share */}
        <button type="button" onClick={handleShare} className="cursor-pointer" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(0,0,0,0.40)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Share2 style={{ width: 20, height: 20, color: "#fff" }} />
          </div>
        </button>
      </div>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<string | null>(null);

  const fetchFlicks = useCallback(async (cursor: string | null = null) => {
    const args: Record<string, unknown> = { p_limit: PAGE_SIZE };
    if (cursor) args.p_cursor = cursor;
    const { data, error } = await (supabase.rpc("get_flicks_feed" as any, args) as any);
    if (error) { toast.error("Couldn't load flicks"); return []; }
    return (data || []) as Flick[];
  }, []);

  useEffect(() => {
    (async () => {
      const data = await fetchFlicks(null);
      setFlicks(data);
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
      cursorRef.current = data[data.length - 1].created_at;
    }
    setHasMore(data.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [loadingMore, hasMore, fetchFlicks]);

  // Track active index via scroll + load-more trigger
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

  if (loading) {
    return (
      <div style={{ height: "100dvh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: 32, height: 32, color: "#FF5A1F", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!loading && flicks.length === 0) {
    return (
      <div style={{ height: "100dvh", background: "var(--bg-page)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,90,31,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ImagePlus style={{ width: 32, height: 32, color: "#FF5A1F" }} />
        </div>
        <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", fontFamily: "'Bricolage Grotesque', sans-serif" }}>No Flicks yet</p>
        <p style={{ fontSize: 14, color: "var(--text-3)", textAlign: "center" }}>Flicks are image-only posts. Check back soon!</p>
        <button type="button" onClick={() => navigate(-1)} className="cursor-pointer" style={{ padding: "10px 24px", borderRadius: 999, background: "#FF5A1F", color: "#fff", fontWeight: 600, fontSize: 14, border: "none" }}>
          Go back
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height: "100dvh", background: "#000" }}>
      {/* Vertical scroll container */}
      <div
        ref={containerRef}
        style={{
          height: "100dvh",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
        }}
      >
        {flicks.map((flick, idx) => (
          <div key={flick.id} style={{ height: "100dvh", width: "100%" }}>
            <FlickCard
              flick={flick}
              isActive={idx === activeIdx}
              onLike={() => {}}
              onFollow={() => {}}
            />
          </div>
        ))}
        {loadingMore && (
          <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
            <Loader2 style={{ width: 24, height: 24, color: "#FF5A1F", animation: "spin 1s linear infinite" }} />
          </div>
        )}
      </div>

      {/* Nav arrows — desktop */}
      <div className="hidden md:flex" style={{ position: "fixed", right: 80, top: "50%", transform: "translateY(-50%)", flexDirection: "column", gap: 8, zIndex: 10 }}>
        <button
          type="button"
          onClick={() => goTo(Math.max(0, activeIdx - 1))}
          disabled={activeIdx === 0}
          className="cursor-pointer"
          style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(0,0,0,0.50)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", opacity: activeIdx === 0 ? 0.3 : 1 }}
        >
          <ChevronUp style={{ width: 20, height: 20, color: "#fff" }} />
        </button>
        <button
          type="button"
          onClick={() => goTo(Math.min(flicks.length - 1, activeIdx + 1))}
          disabled={activeIdx >= flicks.length - 1}
          className="cursor-pointer"
          style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(0,0,0,0.50)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", opacity: activeIdx >= flicks.length - 1 ? 0.3 : 1 }}
        >
          <ChevronDown style={{ width: 20, height: 20, color: "#fff" }} />
        </button>
      </div>

      {/* Progress dots */}
      <div style={{
        position: "fixed", right: 14, top: "50%", transform: "translateY(-50%)",
        display: "flex", flexDirection: "column", gap: 4, zIndex: 10,
      }} className="md:hidden">
        {flicks.slice(Math.max(0, activeIdx - 2), activeIdx + 5).map((_, i) => {
          const realIdx = Math.max(0, activeIdx - 2) + i;
          return (
            <div
              key={realIdx}
              onClick={() => goTo(realIdx)}
              style={{
                width: realIdx === activeIdx ? 6 : 4,
                height: realIdx === activeIdx ? 6 : 4,
                borderRadius: 999,
                background: realIdx === activeIdx ? "#FF5A1F" : "rgba(255,255,255,0.40)",
                transition: "all 200ms",
                cursor: "pointer",
              }}
            />
          );
        })}
      </div>

      {/* Count */}
      <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.50)", borderRadius: 999, padding: "4px 12px", zIndex: 10 }}>
        <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{activeIdx + 1} / {flicks.length}</span>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
