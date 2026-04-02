import { useState, useRef, useEffect } from "react";
import { X, Link2, MapPin, Globe, Loader2, PencilLine, Layers, Image as ImageIcon, FileText, Target, Users, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const postTypes = [
  { id: "thought", label: "Thought", icon: PencilLine },
  { id: "work", label: "Work update", icon: Layers },
  { id: "pdf", label: "PDF", icon: FileText },
  { id: "opportunity", label: "Opportunity", icon: Target },
  { id: "collab", label: "Collaboration", icon: Users },
];

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

const extractMentions = (text: string): string[] =>
  (text.match(/@\w+/g) || []).map(t => t.slice(1));

const NewPostModal = ({ open, onClose, defaultType, onPublished }: NewPostModalProps) => {
  const [type, setType] = useState(defaultType || "thought");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("everyone");
  const [publishing, setPublishing] = useState(false);
  const [title, setTitle] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (defaultType) setType(defaultType); }, [defaultType]);

  // Search mentions from Supabase
  useEffect(() => {
    if (!showMentions || mentionFilter.length < 1) {
      setMentionResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, role")
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
      setShowMentions(true);
      setMentionFilter("");
    } else if (lastAt >= 0) {
      const after = value.slice(lastAt + 1);
      if (!after.includes(" ") && after.length < 20) {
        setShowMentions(true);
        setMentionFilter(after.toLowerCase());
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (username: string) => {
    const lastAt = content.lastIndexOf("@");
    const before = content.slice(0, lastAt);
    setContent(`${before}@${username} `);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleImageUpload = () => {
    if (images.length >= 4) { toast.info("Maximum 4 images"); return; }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, 4 - images.length).forEach(file => {
      const url = URL.createObjectURL(file);
      setImages(prev => [...prev, url].slice(0, 4));
      setImageFiles(prev => [...prev, file].slice(0, 4));
    });
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePublish = async () => {
    if (!content.trim()) {
      toast.error("Write something first");
      return;
    }

    setPublishing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to post");
        setPublishing(false);
        return;
      }

      // Upload images if any
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("work-assets")
          .upload(path, file);
        if (!uploadError) {
          const { data: signedData } = await supabase.storage
            .from("work-assets")
            .createSignedUrl(path, 60 * 60 * 24 * 365);
          if (signedData?.signedUrl) uploadedUrls.push(signedData.signedUrl);
        }
      }

      const { error } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          content: content.trim(),
          post_type: type,
          type: type,
          visibility: visibility,
          hashtags: extractHashtags(content),
          image_urls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
          created_at: new Date().toISOString(),
        } as any);

      if (error) throw error;

      onClose();
      setContent("");
      setTitle("");
      setImages([]);
      setImageFiles([]);
      toast.success("Posted successfully ✓");
      onPublished?.();
    } catch (err: any) {
      toast.error("Failed to post. Try again.");
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 300) + "px"; }
  };

  const imageGridClass = images.length === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4" style={{ background: "rgba(4,6,26,0.7)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div
        className="w-full sm:max-w-[560px] max-h-[85vh] overflow-y-auto rounded-t-[20px] sm:rounded-2xl border border-border/30"
        style={{ background: "var(--surface)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2">
          <div className="w-9 h-[5px] rounded-full" style={{ background: "var(--border-2)" }} />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h2 className="text-[16px] font-bold text-t1">Create post</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-t3 hover:text-t1 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-2 overflow-x-auto px-5 py-3 scrollbar-hide">
          {postTypes.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              className="whitespace-nowrap text-[12px] font-bold px-3.5 h-8 rounded-full transition-all duration-200 shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
              style={{
                background: type === t.id ? "var(--brand)" : "var(--surface-2)",
                color: type === t.id ? "white" : "var(--text-2)",
                border: type === t.id ? "none" : "1px solid var(--border-2)",
                boxShadow: type === t.id ? "0 2px 8px var(--brand-glow)" : "none",
              }}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        <div className="px-5 pb-3 relative">
          {(type === "opportunity" || type === "collab") && (
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full h-11 px-3.5 mb-3 text-[14px] outline-none rounded-xl bg-surface-2 border border-border/30 text-t1 placeholder:text-t3 transition-all duration-200 focus:border-brand" />
          )}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => { handleContentChange(e.target.value); autoResize(); }}
            placeholder={type === "thought" ? "What are you building today?" : "Describe..."}
            className="w-full min-h-[120px] px-3.5 py-3 text-[14px] resize-none outline-none rounded-xl bg-surface-2 border border-border/30 text-t1 placeholder:text-t3 transition-all duration-200 focus:border-brand"
            style={{ lineHeight: 1.6 }}
          />

          {showMentions && mentionResults.length > 0 && (
            <div className="absolute left-5 right-5 z-50 rounded-xl border border-border/30 shadow-lg overflow-hidden" style={{ background: "var(--surface)", top: "auto" }}>
              {mentionResults.map(m => (
                <button key={m.username} onClick={() => insertMention(m.username)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2 transition-all duration-200 cursor-pointer">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <AtSign className="w-4 h-4 text-brand" />
                  )}
                  <div>
                    <p className="text-[13px] font-bold text-t1">{m.full_name || m.username}</p>
                    <p className="text-[11px] text-t3">@{m.username}{m.role ? ` · ${m.role}` : ""}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {images.length > 0 && (
            <div className={`grid ${imageGridClass} gap-2 mt-3`}>
              {images.map((img, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden bg-surface-2 aspect-video">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center cursor-pointer">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {type === "pdf" && (
            <div className="mt-3 rounded-xl p-10 text-center cursor-pointer transition-all duration-200 hover:border-brand hover:bg-brand-dim border-2 border-dashed border-border/30 bg-surface-2" onClick={handleImageUpload}>
              <FileText className="w-8 h-8 mx-auto mb-2 text-t3" />
              <p className="text-[12px] text-t3">Select a PDF from device</p>
              <p className="text-[10px] mt-1 text-t3">PDF files only · Max 10MB</p>
            </div>
          )}
          {type === "work" && (
            <button className="w-full mt-3 rounded-xl p-3 text-left text-[12px] flex items-center gap-2 transition-all duration-200 bg-surface-2 border border-border/30 text-t2 hover:border-brand cursor-pointer active:scale-[0.99]">
              <Layers className="w-4 h-4 text-brand" /> Link a project from My Work
            </button>
          )}
        </div>

        <div className="mx-5 mb-3 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-2 border border-border/30">
          <Globe className="w-4 h-4 text-t3" />
          <span className="text-[12px] text-t2">Visible to</span>
          <select value={visibility} onChange={e => setVisibility(e.target.value)}
            className="bg-transparent text-[12px] font-semibold outline-none text-t1 cursor-pointer">
            <option value="everyone">Everyone</option>
            <option value="connections">My Strands</option>
            <option value="workspace">Same institution</option>
          </select>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-border/30">
          <div className="flex items-center gap-1">
            <button onClick={handleImageUpload} className="p-2 rounded-lg text-t3 hover:text-t1 hover:bg-surface-2 transition-all duration-200 cursor-pointer active:scale-95"><ImageIcon className="w-4 h-4" /></button>
            <button className="p-2 rounded-lg text-t3 hover:text-t1 hover:bg-surface-2 transition-all duration-200 cursor-pointer active:scale-95"><Link2 className="w-4 h-4" /></button>
            <button className="p-2 rounded-lg text-t3 hover:text-t1 hover:bg-surface-2 transition-all duration-200 cursor-pointer active:scale-95"><MapPin className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-t3">{content.length}/{charLimit}</span>
            <Button size="default" onClick={handlePublish} disabled={publishing || !content.trim()} className="active:scale-95 transition-all duration-200">
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
