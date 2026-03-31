import { useState, useRef, useEffect } from "react";
import { X, Link2, MapPin, Globe, Loader2, PencilLine, Layers, Image as ImageIcon, FileText, Target, Users, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const postTypes = [
  { id: "thought", label: "Thought", icon: PencilLine },
  { id: "work", label: "Work update", icon: Layers },
  { id: "pdf", label: "PDF", icon: FileText },
  { id: "opportunity", label: "Opportunity", icon: Target },
  { id: "collab", label: "Collaboration", icon: Users },
];

const mockMentions = [
  { name: "Priya Menon", username: "priyam", role: "Faculty" },
  { name: "Rahul Kumar", username: "rahulk", role: "Professional" },
  { name: "Riya Sharma", username: "riyas", role: "Student" },
  { name: "Dr. Neha Sharma", username: "drneha", role: "Doctor" },
];

interface NewPostModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: string;
}

const NewPostModal = ({ open, onClose, defaultType }: NewPostModalProps) => {
  const [type, setType] = useState(defaultType || "thought");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("Everyone");
  const [publishing, setPublishing] = useState(false);
  const [title, setTitle] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (defaultType) setType(defaultType); }, [defaultType]);

  if (!open) return null;

  const charLimit = 3000;

  const handleContentChange = (value: string) => {
    setContent(value.slice(0, charLimit));
    // Check for @ mentions
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
    });
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  const handlePublish = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      onClose();
      setContent("");
      setTitle("");
      setImages([]);
      toast.success("Posted successfully");
    }, 800);
  };

  // Auto-expand textarea
  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 300) + "px"; }
  };

  const filteredMentions = mockMentions.filter(m => m.name.toLowerCase().includes(mentionFilter) || m.username.includes(mentionFilter));

  // Image grid class
  const imageGridClass = images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-2";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4" style={{ background: "rgba(4,6,26,0.7)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div
        className="w-full sm:max-w-[560px] max-h-[85vh] overflow-y-auto rounded-t-[20px] sm:rounded-2xl border border-border/30"
        style={{ background: "var(--surface)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2">
          <div className="w-9 h-[5px] rounded-full" style={{ background: "var(--border-2)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <h2 className="text-[16px] font-bold text-t1">Create post</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-t3 hover:text-t1 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {/* Type selector */}
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

        {/* Content */}
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

          {/* @ Mentions dropdown */}
          {showMentions && filteredMentions.length > 0 && (
            <div className="absolute left-5 right-5 z-50 rounded-xl border border-border/30 shadow-lg overflow-hidden" style={{ background: "var(--surface)", top: "auto" }}>
              {filteredMentions.map(m => (
                <button key={m.username} onClick={() => insertMention(m.username)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2 transition-all duration-200 cursor-pointer">
                  <AtSign className="w-4 h-4 text-brand" />
                  <div>
                    <p className="text-[13px] font-bold text-t1">{m.name}</p>
                    <p className="text-[11px] text-t3">@{m.username} · {m.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Image uploads */}
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

        {/* Visibility */}
        <div className="mx-5 mb-3 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-2 border border-border/30">
          <Globe className="w-4 h-4 text-t3" />
          <span className="text-[12px] text-t2">Visible to</span>
          <select value={visibility} onChange={e => setVisibility(e.target.value)}
            className="bg-transparent text-[12px] font-semibold outline-none text-t1 cursor-pointer">
            <option>Everyone</option>
            <option>My Strands</option>
            <option>Same institution</option>
          </select>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border/30">
          <div className="flex items-center gap-1">
            <button onClick={handleImageUpload} className="p-2 rounded-lg text-t3 hover:text-t1 hover:bg-surface-2 transition-all duration-200 cursor-pointer active:scale-95"><ImageIcon className="w-4 h-4" /></button>
            <button className="p-2 rounded-lg text-t3 hover:text-t1 hover:bg-surface-2 transition-all duration-200 cursor-pointer active:scale-95"><Link2 className="w-4 h-4" /></button>
            <button className="p-2 rounded-lg text-t3 hover:text-t1 hover:bg-surface-2 transition-all duration-200 cursor-pointer active:scale-95"><MapPin className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-t3">{content.length}/{charLimit}</span>
            <Button size="default" onClick={handlePublish} disabled={publishing} className="active:scale-95 transition-all duration-200">
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
