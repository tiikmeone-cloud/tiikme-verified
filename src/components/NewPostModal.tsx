import { storageImageUrl } from "@/lib/imageTransform";
import { useState, useRef, useEffect } from "react";
import { X, Loader2, Image as ImageIcon, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MentionUser {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
}

interface NewPostModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: string;
  onPublished?: () => void;
}

const extractHashtags = (text: string): string[] =>
  (text.match(/#\w+/g) || []).map(t => t.slice(1));

const NewPostModal = ({ open, onClose, onPublished }: NewPostModalProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("everyone");
  const [publishing, setPublishing] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showMentions || mentionFilter.length < 1) { setMentionResults([]); return; }
    const timeout = setTimeout(async () => {
      const { data } = await supabase.from("profiles")
        .select("id, username, full_name, avatar_url, role")
        .neq("id", user?.id || "")
        .or(`username.ilike.%${mentionFilter}%,full_name.ilike.%${mentionFilter}%`)
        .limit(5);
      setMentionResults((data as MentionUser[]) || []);
    }, 300);
    return () => clearTimeout(timeout);
  }, [showMentions, mentionFilter]);

  if (!open) return null;

  const charLimit = 3000;

  const handleContentChange = (value: string) => {
    setContent(value.slice(0, charLimit));
    const lastAt = value.lastIndexOf("@");
    if (lastAt >= 0 && lastAt === value.length - 1) {
      setShowMentions(true); setMentionFilter("");
    } else if (lastAt >= 0) {
      const after = value.slice(lastAt + 1);
      if (!after.includes(" ") && after.length < 20) { setShowMentions(true); setMentionFilter(after.toLowerCase()); }
      else setShowMentions(false);
    } else setShowMentions(false);
  };

  const insertMention = (username: string) => {
    const lastAt = content.lastIndexOf("@");
    setContent(content.slice(0, lastAt) + `@${username} `);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleImageUpload = () => {
    if (imagePreviews.length >= 4) { toast.info("Maximum 4 images"); return; }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, 4 - imagePreviews.length).forEach(file => {
      if (!file.type.startsWith("image/")) { toast.error("Only images allowed"); return; }
      if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
      setImagePreviews(prev => [...prev, URL.createObjectURL(file)].slice(0, 4));
      setImageFiles(prev => [...prev, file].slice(0, 4));
    });
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePublish = async () => {
    if (!content.trim()) { toast.error("Write something first"); return; }
    setPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in"); setPublishing(false); return; }

      // Upload images to post-images bucket
      const uploadedUrls: string[] = [];
      if (imageFiles.length > 0) {
        setImageUploading(true);
        for (const file of imageFiles) {
          const safeName = file.name.replace(/[^a-z0-9.]/gi, "_");
          const path = `${user.id}/${Date.now()}-${safeName}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("post-images")
            .upload(path, file, { upsert: false, contentType: file.type });
          if (uploadError) {
            console.error("Upload error:", uploadError);
            toast.error("Image upload failed: " + uploadError.message);
            continue;
          }
          const { data: urlData } = supabase.storage
            .from("post-images")
            .getPublicUrl(uploadData.path);
          if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl);
        }
        setImageUploading(false);
      }

      const { error } = await supabase.from("posts").insert({
        author_id: user.id, content: content.trim(), post_type: "thought", type: "thought",
        visibility, hashtags: extractHashtags(content),
        image_urls: uploadedUrls.length > 0 ? uploadedUrls : [],
      } as any).select().single();
      if (error) throw error;
      onClose(); setContent(""); setImagePreviews([]); setImageFiles([]);
      toast.success("Posted ✓"); onPublished?.();
    } catch (err: any) { toast.error("Failed to post"); console.error(err); }
    finally { setPublishing(false); }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 300) + "px"; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4" style={{ background: "rgba(4,6,26,0.7)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div className="w-full sm:max-w-[560px] max-h-[85vh] overflow-y-auto rounded-t-[20px] sm:rounded-2xl border border-border/30" style={{ background: "var(--surface)" }} onClick={e => e.stopPropagation()}>
        <div className="sm:hidden flex justify-center pt-2"><div className="w-9 h-[5px] rounded-full" style={{ background: "var(--border-2)" }} /></div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h2 className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Create post</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 py-3 relative">
          <textarea ref={textareaRef} value={content} onChange={e => { handleContentChange(e.target.value); autoResize(); }}
            placeholder="What's on your mind?" className="w-full min-h-[120px] px-3.5 py-3 text-[14px] resize-none outline-none rounded-xl"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)", lineHeight: 1.6 }} />
          {showMentions && mentionResults.length > 0 && (
            <div className="absolute left-5 right-5 z-50 rounded-xl border shadow-lg overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {mentionResults.map(m => (
                <button type="button" key={m.username} onClick={() => insertMention(m.username)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer hover:bg-[var(--surface-2)]">
                  {m.avatar_url ? <img src={(m.avatar_url || "").replace("/storage/v1/render/image/", "/storage/v1/object/public/")} alt="" className="w-6 h-6 object-cover" style={{ borderRadius: 0 }} /> : <AtSign className="w-4 h-4" style={{ color: "var(--brand)" }} />}
                  <div><p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{m.full_name || m.username}</p><p className="text-[11px]" style={{ color: "var(--text-3)" }}>@{m.username}</p></div>
                </button>
              ))}
            </div>
          )}
          {imagePreviews.length > 0 && (
            <div className={`grid ${imagePreviews.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-2 mt-3`}>
              {imagePreviews.map((img, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden aspect-video" style={{ background: "var(--surface-2)" }}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center cursor-pointer"><X className="w-3 h-3 text-white" /></button>
                </div>
              ))}
            </div>
          )}
          {imageUploading && (
            <div className="flex items-center gap-2 mt-2 text-[12px]" style={{ color: "var(--text-3)" }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Uploading images...
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button type="button" onClick={handleImageUpload} className="p-2 rounded-lg cursor-pointer active:scale-95" style={{ color: "var(--text-3)" }}><ImageIcon className="w-5 h-5" /></button>
          <div className="flex items-center gap-3">
            <span className="text-[12px]" style={{ color: "var(--text-3)" }}>{content.length}/{charLimit}</span>
            <Button onClick={handlePublish} disabled={publishing || imageUploading || !content.trim()} className="active:scale-95">
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish"}
            </Button>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  );
};

export default NewPostModal;
