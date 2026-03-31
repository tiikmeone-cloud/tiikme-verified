import { useState } from "react";
import { X, Link2, MapPin, Globe, Loader2, PencilLine, Layers, Image as ImageIcon, FileText, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const postTypes = [
  { id: "thought", label: "Thought", icon: PencilLine },
  { id: "work", label: "Work update", icon: Layers },
  { id: "pdf", label: "PDF", icon: FileText },
  { id: "opportunity", label: "Opportunity", icon: Target },
  { id: "collab", label: "Collaboration", icon: Users },
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

  if (!open) return null;

  const charLimit = 600;

  const handlePublish = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      onClose();
      setContent("");
      setTitle("");
      toast.success("Posted successfully");
    }, 800);
  };

  const inputStyle: React.CSSProperties = {
    background: "var(--surface-2)",
    border: "1.5px solid var(--border-2)",
    borderRadius: 14,
    color: "var(--text-1)",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4" style={{ background: "rgba(4,6,26,0.7)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div
        className="w-full sm:max-w-[560px] max-h-[85vh] overflow-y-auto rounded-t-[20px] sm:rounded-[20px]"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2">
          <div className="w-9 h-[5px] rounded-full" style={{ background: "var(--border-2)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Create post</h2>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: "var(--text-3)" }}><X className="w-5 h-5" /></button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2 overflow-x-auto px-5 py-3 scrollbar-hide">
          {postTypes.map(t => (
            <button key={t.id} onClick={() => setType(t.id)}
              className="whitespace-nowrap text-[12px] font-bold px-3.5 h-8 rounded-full transition-all shrink-0 flex items-center gap-1.5"
              style={{
                background: type === t.id ? "var(--brand)" : "var(--surface)",
                color: type === t.id ? "white" : "var(--text-2)",
                border: type === t.id ? "none" : "1px solid var(--border-2)",
                boxShadow: type === t.id ? "0 2px 8px var(--brand-glow)" : "none",
              }}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-5 pb-3">
          {(type === "opportunity" || type === "collab") && (
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full h-11 px-3.5 mb-3 text-[14px] outline-none" style={inputStyle} />
          )}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, charLimit))}
            placeholder={type === "thought" ? "What are you building today?" : "Describe..."}
            className="w-full min-h-[120px] px-3.5 py-3 text-[14px] resize-none outline-none"
            style={{ ...inputStyle, lineHeight: 1.6 }}
          />
          {type === "pdf" && (
            <div className="mt-3 rounded-2xl p-10 text-center cursor-pointer transition-colors" style={{ border: "2px dashed var(--border-2)", background: "var(--surface)" }}>
              <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
              <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Select a PDF from device</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-3)" }}>PDF files only · Max 10MB</p>
            </div>
          )}
          {type === "work" && (
            <button className="w-full mt-3 rounded-xl p-3 text-left text-[12px] flex items-center gap-2 transition-colors" style={{ background: "var(--surface)", border: "1px solid var(--border-2)", color: "var(--text-2)" }}>
              <Layers className="w-4 h-4" style={{ color: "var(--brand)" }} /> Link a project from My Work
            </button>
          )}
        </div>

        {/* Visibility */}
        <div className="mx-5 mb-3 flex items-center gap-2 px-3.5 py-2 rounded-[10px]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Globe className="w-4 h-4" style={{ color: "var(--text-3)" }} />
          <span className="text-[12px]" style={{ color: "var(--text-2)" }}>Visible to</span>
          <select value={visibility} onChange={e => setVisibility(e.target.value)}
            className="bg-transparent text-[12px] font-semibold outline-none" style={{ color: "var(--text-1)" }}>
            <option>Everyone</option>
            <option>My Strands</option>
            <option>Same institution</option>
          </select>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-1">
            {[ImageIcon, Link2, MapPin].map((Icon, i) => (
              <button key={i} className="p-2 rounded-lg transition-colors" style={{ color: "var(--text-3)" }}><Icon className="w-4 h-4" /></button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px]" style={{ color: "var(--text-3)" }}>{content.length}/{charLimit}</span>
            <Button size="default" onClick={handlePublish} disabled={publishing}>
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPostModal;
