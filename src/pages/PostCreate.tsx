import { storageImageUrl } from "@/lib/imageTransform";
import { useState, useRef } from "react";
import { ArrowLeft, Image as ImageIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgIdentity } from "@/contexts/OrgIdentityContext";
import { supabase } from "@/integrations/supabase/client";

const MAX_IMAGES = 20;

const PostCreate = () => {
  const navigate = useNavigate();
  const { user, profile, initials } = useAuth();
  const { isInstitution, org, identityName, identityAvatar, identityInitials } = useOrgIdentity();
  const [content, setContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const charLimit = 3000;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - imageFiles.length;
    if (remaining <= 0) { toast.error(`Max ${MAX_IMAGES} images`); return; }
    const toAdd = files.slice(0, remaining);
    const valid: File[] = [];
    const previews: string[] = [];
    for (const file of toAdd) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is over 10MB`); continue; }
      valid.push(file);
      previews.push(URL.createObjectURL(file));
    }
    setImageFiles(prev => [...prev, ...valid]);
    setImagePreviews(prev => [...prev, ...previews]);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePublish = async () => {
    if (!content.trim() && imageFiles.length === 0) { toast.error("Write something or add an image"); return; }
    if (!user) { toast.error("Please sign in"); return; }
    setPublishing(true);
    try {
      let imageUrls: string[] = [];

      if (imageFiles.length > 0) {
        setUploading(true);
        for (const file of imageFiles) {
          const safeName = file.name.replace(/[^a-z0-9.]/gi, "_");
          const path = `${user.id}/${Date.now()}-${safeName}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("post-images")
            .upload(path, file, { upsert: false, contentType: file.type });
          if (uploadError) { toast.error("Upload failed: " + uploadError.message); setPublishing(false); setUploading(false); return; }
          const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(uploadData.path);
          if (urlData?.publicUrl) imageUrls.push(urlData.publicUrl);
        }
        setUploading(false);
      }

      const postData: any = {
        author_id: user.id,
        content: content.trim(),
        post_type: "thought",
        type: "thought",
        visibility: "everyone",
        hashtags: (content.match(/#\w+/g) || []).map(t => t.slice(1)),
        image_urls: imageUrls,
      };
      // Institution accounts post as org
      if (isInstitution && org) {
        postData.posted_by_org = org.id;
        postData.posted_by_user_id = user.id;
        postData.workspace_name = `org:${org.id}`;
      }

      const { error } = await supabase.from("posts").insert(postData).select().single();

      if (error) throw error;

      // Award activity score
      await supabase.rpc("increment_score", { uid: user.id, amount: 5 });

      toast.success("Posted");
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
    <main className="max-w-[660px] mx-auto px-4 py-3 md:py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-[14px] font-semibold cursor-pointer min-h-[44px]" style={{ color: "var(--text-2)" }}>
          <ArrowLeft className="w-5 h-5" /> Create Post
        </button>
        <Button onClick={handlePublish} disabled={publishing || uploading || (!content.trim() && imageFiles.length === 0)} className="rounded-full px-6 h-11">
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish"}
        </Button>
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0 overflow-hidden" style={{ backgroundColor: "var(--brand)" }}>
          {identityAvatar ? <img src={storageImageUrl(identityAvatar, "avatar")} alt="" className="w-full h-full object-cover" /> : identityInitials}
        </div>
        <div>
          <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{identityName || "You"}</p>
          <p className="text-[11px]" style={{ color: "var(--text-3)" }}>
            {isInstitution ? `Posting as ${org?.name || "Organisation"}` : "Posting to everyone"}
          </p>
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
        {imageFiles.length > 0 && <span className="text-[11px] font-bold" style={{ color: "var(--brand)" }}>{imageFiles.length}/{MAX_IMAGES} images</span>}
      </div>

      {/* Image previews — horizontal scroll */}
      {imagePreviews.length > 0 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {imagePreviews.map((preview, idx) => (
            <div key={idx} className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden" style={{ background: "var(--surface-2)" }}>
              <img src={preview} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center cursor-pointer">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 mt-3 text-[12px]" style={{ color: "var(--text-3)" }}>
          <Loader2 className="w-3 h-3 animate-spin" /> Uploading images...
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-all min-h-[44px]" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>
          <ImageIcon className="w-4 h-4" />
          <span className="text-[13px] font-medium">{imageFiles.length > 0 ? "Add More" : "Add Photos"}</span>
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
    </main>
  );
};

export default PostCreate;
