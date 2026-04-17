import { useState, useRef, useEffect } from "react";
import { X, Loader2, Image as ImageIcon } from "lucide-react";
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
    const { data, error } = await supabase
      .from("posts")
      .update({
        content: content.trim(),
        is_edited: true,
        updated_at: new Date().toISOString(),
        hashtags: (content.match(/#\w+/g) || []).map((t: string) => t.slice(1)),
      })
      .eq("id", post.id)
      .eq("author_id", user.id)
      .select("*")
      .single();
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Post updated");
    onSaved({ ...post, ...data });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(26,26,78,0.40)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
      <div
        className="relative glass-dark rounded-3xl w-full max-w-[560px] mx-4 p-6"
        onClick={e => e.stopPropagation()}
        style={{ animation: "slideUp 0.3s ease" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Edit Post</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer" style={{ background: "rgba(255,255,255,0.1)" }}>
            <X className="w-4 h-4" style={{ color: "var(--text-2)" }} />
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => { setContent(e.target.value.slice(0, 3000)); autoResize(); }}
          className="w-full min-h-[120px] px-4 py-3 text-[14px] resize-none outline-none rounded-xl glass-input-dark"
          style={{ color: "var(--text-1)", lineHeight: 1.7 }}
        />

        {post.image_urls?.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {post.image_urls.map((url: string, i: number) => (
              <div key={i} className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--surface-2)" }}>
                <img src={fixStorageUrl(url) || ""} alt="" loading="lazy" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button type="button" onClick={onClose} className="text-[13px] font-semibold px-4 py-2 cursor-pointer" style={{ color: "var(--text-2)" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="btn-liquid-primary rounded-full px-6 py-2 text-[13px] font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
