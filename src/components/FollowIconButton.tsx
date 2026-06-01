import { useState } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FollowIconButtonProps {
  targetId: string;
  targetUsername?: string;
  initialFollowing?: boolean;
  size?: number;
}

/**
 * Self-contained follow toggle.
 * Not following → accent-outline circle with + icon.
 * Following     → accent-filled circle with ✓ icon.
 * Manages its own DB state; optimistic with rollback.
 */
export function FollowIconButton({
  targetId,
  targetUsername,
  initialFollowing = false,
  size = 32,
}: FollowIconButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  const iconSize = Math.round(size * 0.5);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (busy) return;

    if (following) {
      toast(`Unfollow${targetUsername ? ` @${targetUsername}` : ""}?`, {
        action: {
          label: "Unfollow",
          onClick: async () => {
            setBusy(true);
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error("not signed in");
              const { error } = await supabase
                .from("user_follows" as any)
                .delete()
                .eq("follower_id", user.id)
                .eq("following_id", targetId) as any;
              if (error) throw error;
              setFollowing(false);
              toast(`Unfollowed${targetUsername ? ` @${targetUsername}` : ""}`);
            } catch {
              toast.error("Could not unfollow. Try again.");
            } finally {
              setBusy(false);
            }
          },
        },
        cancel: { label: "Cancel", onClick: () => {} },
        duration: 5000,
      });
      return;
    }

    setFollowing(true);
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not signed in");
      const { error } = await supabase
        .from("user_follows" as any)
        .insert({ follower_id: user.id, following_id: targetId }) as any;
      if (error) throw error;
      toast.success(`Following${targetUsername ? ` @${targetUsername}` : ""}!`);
    } catch {
      setFollowing(false);
      toast.error("Could not follow. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={following ? `Unfollow${targetUsername ? ` @${targetUsername}` : ""}` : `Follow${targetUsername ? ` @${targetUsername}` : ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: following ? "none" : "2px solid #FF5A1F",
        background: following ? "#FF5A1F" : "transparent",
        color: following ? "#fff" : "#FF5A1F",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: busy ? "default" : "pointer",
        transition: "background 150ms, border 150ms, color 150ms",
        flexShrink: 0,
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy
        ? <Loader2 size={iconSize} className="animate-spin" />
        : following
          ? <Check size={iconSize} strokeWidth={3} />
          : <Plus size={iconSize} strokeWidth={2.5} />
      }
    </button>
  );
}
