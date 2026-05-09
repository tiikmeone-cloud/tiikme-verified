import { useState, useRef, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fixStorageUrl } from "@/components/ui/AvatarSquare";
import { useAuth } from "@/contexts/AuthContext";

interface EditPostModalProps {
  post: any;
  onClose: () => void;
  onSaved: (updated: any) => void;
}

const EditPostModal = ({ post, onClose, onSaved }: EditPostModalProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState(post.content || "");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", handleKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.max(120, Math.min(el.scrollHeight, 400)) + "px"; }
  };

  useEffect(() => { autoResize(); }, []);

  const handleSave = async () => {
    if (!content.trim() || !user) return;
    setSaving(true);
    const newContent = content.trim();
    const { data, error } = await supabase
      .from("posts")
      .update({
        content: newContent,
        is_edited: true,
        updated_at: new Date().toISOString(),
        hashtags: (newContent.match(/#\w+/g) || []).map((t: string) => t.slice(1)),
      })
      .eq("id", post.id)
      .eq("author_id", user.id)
      .select("*")
      .single();
    setSaving(false);
    if (error) { toast.error(error.message || "Failed to save"); return; }
    toast.success("Post updated");
    onSaved({ ...post, ...data });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(26,26,78,0.40)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
      <div
        className="relative w-full max-w-[560px] mx-auto flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 20,
          boxShadow: "0 25px 80px rgba(26,26,78,0.25)",
          padding: 24,
          maxHeight: "90vh",
          overflowY: "auto",
          animation: "slideUp 0.3s ease",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold" style={{ color: "#1A1A2E" }}>Edit Post</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#F5F5F5]" style={{ background: "#F0F0F0" }}>
            <X className="w-4 h-4" style={{ color: "#6B7094" }} />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => { setContent(e.target.value.slice(0, 3000)); autoResize(); }}
          className="w-full min-h-[120px] px-4 py-3 text-[14px] resize-none outline-none rounded-xl"
          style={{
            background: "#FFFFFF",
            color: "#1A1A2E",
            border: "1px solid #E5E7EB",
            lineHeight: 1.7,
          }}
        />

        {post.image_urls?.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {post.image_urls.map((url: string, i: number) => (
              <div key={i} className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: "#F5F5F5" }}>
                <img src={fixStorageUrl(url) || ""} alt="" loading="lazy" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-4 pt-4" style={{ borderTop: "1px solid #E5E7EB" }}>
          <button type="button" onClick={onClose} className="text-[13px] font-semibold px-4 py-2 cursor-pointer" style={{ color: "#6B7094", background: "none", border: "none" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="rounded-full px-6 py-2 text-[13px] font-semibold disabled:opacity-50 cursor-pointer"
            style={{ background: "#FF5A1F", color: "#FFFFFF", border: "none" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
