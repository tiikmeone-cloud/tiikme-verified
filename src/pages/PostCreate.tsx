import { useState, useRef } from "react";
import { ArrowLeft, Image as ImageIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PostCreate = () => {
  const navigate = useNavigate();
  const { user, profile, initials } = useAuth();
  const [content, setContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const charLimit = 3000;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only images allowed"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handlePublish = async () => {
    if (!content.trim()) { toast.error("Write something first"); return; }
    if (!user) { toast.error("Please sign in"); return; }
    setPublishing(true);
    try {
      let imageUrls: string[] = [];

      if (imageFile) {
        setUploading(true);
        const safeName = imageFile.name.replace(/[^a-z0-9.]/gi, "_");
        const path = `${user.id}/${Date.now()}-${safeName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, imageFile, { upsert: false, contentType: imageFile.type });
        if (uploadError) { toast.error("Upload failed: " + uploadError.message); setPublishing(false); setUploading(false); return; }
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(uploadData.path);
        if (urlData?.publicUrl) imageUrls.push(urlData.publicUrl);
        setUploading(false);
      }

      const { error } = await supabase.from("posts").insert({
        author_id: user.id,
        content: content.trim(),
        post_type: "thought",
        type: "thought",
        visibility: "everyone",
        hashtags: (content.match(/#\w+/g) || []).map(t => t.slice(1)),
        image_urls: imageUrls,
      } as any).select().single();

      if (error) throw error;
      toast.success("Posted ✓");
      navigate("/app/feed");
    } catch (err: any) {
      toast.error("Failed to post");
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.max(200, Math.min(el.scrollHeight, 500)) + "px"; }
  };

  return (
    <main className="max-w-[660px] mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[14px] font-semibold cursor-pointer" style={{ color: "var(--text-2)" }}>
          <ArrowLeft className="w-5 h-5" /> Create Post
        </button>
        <Button onClick={handlePublish} disabled={publishing || uploading || !content.trim()} className="rounded-full px-6">
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish"}
        </Button>
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0 overflow-hidden" style={{ backgroundColor: "var(--brand)" }}>
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
        <div>
          <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{profile?.full_name || "You"}</p>
          <p className="text-[11px]" style={{ color: "var(--text-3)" }}>Posting to everyone</p>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => { setContent(e.target.value.slice(0, charLimit)); autoResize(); }}
        placeholder="What's on your mind?"
        className="w-full min-h-[200px] px-4 py-3 text-[15px] resize-none outline-none rounded-2xl"
        style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)", lineHeight: 1.7 }}
        autoFocus
      />
      <div className="flex items-center justify-between mt-2 px-1">
        <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{content.length}/{charLimit}</span>
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="relative mt-4 rounded-2xl overflow-hidden" style={{ background: "var(--surface-2)" }}>
          <img src={imagePreview} alt="Preview" className="w-full max-h-96 object-cover rounded-2xl" />
          <button onClick={removeImage} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 mt-3 text-[12px]" style={{ color: "var(--text-3)" }}>
          <Loader2 className="w-3 h-3 animate-spin" /> Uploading image...
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-all" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
          <ImageIcon className="w-4 h-4" />
          <span className="text-[13px] font-medium">{imageFile ? "Change Photo" : "Add Photo"}</span>
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
    </main>
  );
};

export default PostCreate;
