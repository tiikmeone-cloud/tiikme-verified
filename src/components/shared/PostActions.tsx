// src/components/shared/PostActions.tsx
// Unified post action bar: like, comment, repost, share
// Works for: feed posts, circle posts, opportunity posts
// All actions optimistic with rollback on error

import React, { useState, useCallback } from "react";
import { Heart, MessageCircle, Repeat2, Share2, BarChart2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type PostSource = "feed" | "circle" | "opportunity";

interface PostActionsProps {
  postId: string;
  source: PostSource;
  initialLikeCount: number;
  initialCommentCount: number;
  initialRepostCount?: number;
  isLikedByMe: boolean;
  authorId: string;
  onCommentClick?: () => void;
  onAnalyticsClick?: () => void;
  showAnalytics?: boolean; // own post
  viewCount?: number;
}

export function PostActions({
  postId,
  source,
  initialLikeCount,
  initialCommentCount,
  initialRepostCount = 0,
  isLikedByMe,
  authorId,
  onCommentClick,
  onAnalyticsClick,
  showAnalytics = false,
  viewCount = 0,
}: PostActionsProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(isLikedByMe);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [repostCount, setRepostCount] = useState(initialRepostCount);
  const [loading, setLoading] = useState<string | null>(null);

  const handleLike = useCallback(async () => {
    if (!user) { toast.error("Sign in to like posts"); return; }
    const wasLiked = liked;
    // Optimistic update
    setLiked(!wasLiked);
    setLikeCount(c => wasLiked ? Math.max(0, c - 1) : c + 1);

    try {
      if (source === "feed") {
        if (wasLiked) {
          const { error } = await supabase
            .from("post_reactions")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", user.id)
            .eq("reaction_type", "like");
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("post_reactions")
            .insert({ post_id: postId, user_id: user.id, reaction_type: "like" });
          if (error) throw error;
        }
      } else if (source === "circle") {
        if (wasLiked) {
          await supabase
            .from("circle_post_upvotes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("circle_post_upvotes")
            .insert({ post_id: postId, user_id: user.id });
        }
      } else if (source === "opportunity") {
        if (wasLiked) {
          await supabase
            .from("opportunity_likes")
            .delete()
            .eq("opportunity_id", postId)
            .eq("user_id", user.id);
        } else {
          await supabase
            .from("opportunity_likes")
            .insert({ opportunity_id: postId, user_id: user.id });
        }
      }
    } catch {
      // Rollback
      setLiked(wasLiked);
      setLikeCount(c => wasLiked ? c + 1 : Math.max(0, c - 1));
      toast.error("Could not react. Try again.");
    }
  }, [user, liked, postId, source]);

  const handleRepost = useCallback(async () => {
    if (!user || source !== "feed") return;
    if (loading) return;
    const confirmed = window.confirm("Repost this to your feed?");
    if (!confirmed) return;
    setLoading("repost");
    try {
      await supabase
        .from("post_reposts")
        .insert({ post_id: postId, reposted_by: user.id });
      setRepostCount(c => c + 1);
      toast.success("Reposted!");
    } catch {
      toast.error("Could not repost. Try again.");
    } finally {
      setLoading(null);
    }
  }, [user, postId, source, loading]);

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/post/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      // fallback
      const el = document.createElement("input");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      toast.success("Link copied!");
    }
    // Track share
    if (user) {
      supabase.from("post_shares")
        .insert({ post_id: postId, sender_id: user.id })
        .then(() => {});
    }
  }, [postId, user]);

  const btnCls = "flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#E8733A] " +
    "transition-colors px-2 py-1.5 rounded-lg hover:bg-[#FFF3EC] select-none cursor-pointer";

  return (
    <div className="w-full">
      {/* Analytics row — own posts only */}
      {showAnalytics && (
        <div
          className="flex items-center gap-3 text-xs text-gray-400 px-1 pb-2 pt-1 cursor-pointer hover:text-gray-600"
          onClick={onAnalyticsClick}
        >
          <span className="flex items-center gap-1">
            <BarChart2 size={12} /> {viewCount.toLocaleString()} views
          </span>
          <span>·</span>
          <span>{likeCount} likes · {initialCommentCount} comments · {repostCount} reposts</span>
          <span className="ml-auto text-[#E8733A] font-medium">See analytics ↗</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Action buttons */}
      <div className="flex items-center justify-between py-1 px-1">
        {/* Like */}
        <button className={btnCls + (liked ? " text-[#E8733A]" : "")} onClick={handleLike}>
          <Heart
            size={16}
            className={liked ? "fill-[#E8733A] text-[#E8733A]" : ""}
          />
          <span className={liked ? "font-medium text-[#E8733A]" : ""}>
            {likeCount > 0 ? likeCount : (source === "circle" ? "Upvote" : "Like")}
          </span>
        </button>

        {/* Comment */}
        <button className={btnCls} onClick={onCommentClick}>
          <MessageCircle size={16} />
          <span>{initialCommentCount > 0 ? initialCommentCount : "Comment"}</span>
        </button>

        {/* Repost — feed only */}
        {source === "feed" && (
          <button
            className={btnCls}
            onClick={handleRepost}
            disabled={loading === "repost"}
          >
            <Repeat2 size={16} />
            <span>{repostCount > 0 ? repostCount : "Repost"}</span>
          </button>
        )}

        {/* Share */}
        <button className={btnCls} onClick={handleShare}>
          <Share2 size={16} />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}
