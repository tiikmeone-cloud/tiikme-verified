import { useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface DeletePostDialogProps {
  postId: string;
  onClose: () => void;
  onDeleted: (postId: string) => void;
}

const DeletePostDialog = ({ postId, onClose, onDeleted }: DeletePostDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user) { toast.error("You must be signed in"); return; }
    setDeleting(true);
    // Clean up related data first (works for originals AND reposts since author_id is the deleter)
    await Promise.allSettled([
      supabase.from("post_reactions").delete().eq("post_id", postId),
      supabase.from("post_comments").delete().eq("post_id", postId),
      supabase.from("post_reposts").delete().eq("post_id", postId),
      // If this row is itself a repost, also clear the post_reposts pointer row
      supabase.from("post_reposts").delete().eq("reposted_by", user.id).eq("post_id", postId),
    ]);
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("author_id", user.id);
    setDeleting(false);
    if (error) {
      console.error("[post delete]", error);
      toast.error("Could not delete. Try again.");
      return;
    }
    // Optimistic cache eviction across feed and profile views
    queryClient.setQueriesData({ queryKey: ["feed"] }, (old: any) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: (page.posts || []).filter((p: any) => p.id !== postId),
        })),
      };
    });
    queryClient.invalidateQueries({ queryKey: ["feed"] });
    queryClient.invalidateQueries({ queryKey: ["profile-posts"] });
    toast.success("Deleted");
    onDeleted(postId);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(26,26,78,0.40)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
      <div className="relative glass-dark rounded-2xl w-full max-w-[380px] mx-4 p-6 text-center" onClick={e => e.stopPropagation()}>
        <h3 className="text-[16px] font-bold mb-2" style={{ color: "var(--text-1)" }}>Delete this post?</h3>
        <p className="text-[13px] mb-6" style={{ color: "var(--text-2)" }}>This cannot be undone.</p>
        <div className="flex items-center justify-center gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer" style={{ background: "rgba(255,255,255,0.1)", color: "var(--text-2)" }}>
            Cancel
          </button>
          <button type="button" onClick={handleDelete} disabled={deleting} className="px-5 py-2.5 rounded-full text-[13px] font-bold cursor-pointer disabled:opacity-50" style={{ background: "#DC2626", color: "white" }}>
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeletePostDialog;
