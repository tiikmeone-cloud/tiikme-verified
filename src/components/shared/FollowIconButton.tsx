import { useState, useEffect } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FollowIconButtonProps {
  isFollowing: boolean;
  onFollow: () => Promise<void> | void;
  onUnfollow: () => Promise<void> | void;
  targetName?: string;
  size?: number;
  disabled?: boolean;
}

/**
 * Icon-only follow toggle.
 * Not following → orange ring with + icon.
 * Following → orange filled circle with ✓ icon.
 * Tapping "following" shows a sonner toast confirmation before unfollowing.
 */
export function FollowIconButton({
  isFollowing,
  onFollow,
  onUnfollow,
  targetName,
  size = 32,
  disabled = false,
}: FollowIconButtonProps) {
  const [loading, setLoading] = useState(false);
  const [local, setLocal] = useState(isFollowing);

  useEffect(() => { setLocal(isFollowing); }, [isFollowing]);

  const iconSize = Math.round(size * 0.5);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading || disabled) return;

    if (local) {
      toast(`Unfollow${targetName ? ` ${targetName}` : ""}?`, {
        action: {
          label: "Unfollow",
          onClick: async () => {
            setLoading(true);
            try {
              await onUnfollow();
              setLocal(false);
              toast.success(`Unfollowed${targetName ? ` ${targetName}` : ""}`);
            } catch {
              toast.error("Could not unfollow");
            }
            setLoading(false);
          },
        },
        cancel: { label: "Cancel", onClick: () => {} },
        duration: 5000,
      });
    } else {
      setLocal(true);
      setLoading(true);
      try {
        await onFollow();
        toast.success(`Following${targetName ? ` ${targetName}` : ""}!`);
      } catch {
        setLocal(false);
        toast.error("Could not follow");
      }
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={local ? `Unfollow${targetName ? ` ${targetName}` : ""}` : `Follow${targetName ? ` ${targetName}` : ""}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: local ? "none" : "2px solid #FF5A1F",
        background: local ? "#FF5A1F" : "transparent",
        color: local ? "#fff" : "#FF5A1F",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled || loading ? "default" : "pointer",
        transition: "background 150ms, border 150ms, color 150ms",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {loading
        ? <Loader2 size={iconSize} className="animate-spin" />
        : local
          ? <Check size={iconSize} strokeWidth={3} />
          : <Plus size={iconSize} strokeWidth={2.5} />
      }
    </button>
  );
}
