import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeletePostDialogProps {
  postId: string;
  onClose: () => void;
  onDeleted: (postId: string) => void;
}

const DeletePostDialog = ({ postId, onClose, onDeleted }: DeletePostDialogProps) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    // Clean up related data first
    await Promise.allSettled([
      supabase.from("post_reactions").delete().eq("post_id", postId),
      supabase.from("post_comments").delete().eq("post_id", postId),
      supabase.from("post_reposts").delete().eq("post_id", postId),
    ]);
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    setDeleting(false);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Post deleted");
    onDeleted(postId);
    onClose();
  };

  return (
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
    </div>
  );
};

export default DeletePostDialog;
