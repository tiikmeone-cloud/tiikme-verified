import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image as ImageIcon, Link2, MapPin, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const postTypes = ["Thought", "Project update", "Photo", "Challenge", "Seek collaborator"];

interface NewPostModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: string;
}

const NewPostModal = ({ open, onClose, defaultType }: NewPostModalProps) => {
  const [type, setType] = useState(defaultType || "Thought");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("Everyone");
  const [publishing, setPublishing] = useState(false);
  const [title, setTitle] = useState("");
  const [reward, setReward] = useState("");
  const [roleNeeded, setRoleNeeded] = useState("");
  const [projectLink, setProjectLink] = useState("");

  if (!open) return null;

  const charLimit = 600;

  const handlePublish = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      onClose();
      setContent("");
      setTitle("");
      toast.success("Posted · Visible to everyone", {
        style: { borderLeft: "3px solid #00FFB2" },
      });
    }, 800);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          className="glass-card rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-[560px] max-h-[85vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">Create post</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Post type selector */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
            {postTypes.map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`whitespace-nowrap text-xs font-bold px-4 py-2 rounded-full transition-all shrink-0 ${
                  type === t
                    ? "bg-electric text-white"
                    : "glass-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Content area by type */}
          {type === "Thought" && (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value.slice(0, charLimit))}
              placeholder="What are you building today?"
              className="w-full min-h-[120px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-xl p-4 text-sm resize-none outline-none placeholder:text-muted-foreground focus:border-[rgba(124,111,255,0.5)] transition-colors"
            />
          )}

          {type === "Project update" && (
            <div className="space-y-3">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value.slice(0, charLimit))}
                placeholder="What's new with your project?"
                className="w-full min-h-[100px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-xl p-4 text-sm resize-none outline-none placeholder:text-muted-foreground focus:border-[rgba(124,111,255,0.5)] transition-colors"
              />
              <button className="w-full glass-card rounded-xl p-3 text-left text-xs text-muted-foreground hover:text-foreground hover:bg-[rgba(255,255,255,0.06)] transition-colors flex items-center gap-2">
                <Link2 className="w-4 h-4 text-electric" />
                Link a project from your Build Log
              </button>
            </div>
          )}

          {type === "Photo" && (
            <div className="space-y-3">
              <div className="border-2 border-dashed border-[rgba(255,255,255,0.15)] rounded-xl p-8 text-center hover:border-[rgba(124,111,255,0.4)] transition-colors cursor-pointer">
                <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Drag and drop or click to upload</p>
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value.slice(0, charLimit))}
                placeholder="Add a caption..."
                className="w-full min-h-[60px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-xl p-4 text-sm resize-none outline-none placeholder:text-muted-foreground focus:border-[rgba(124,111,255,0.5)] transition-colors"
              />
            </div>
          )}

          {type === "Challenge" && (
            <div className="space-y-3">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Challenge title"
                className="w-full h-12 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-[rgba(124,111,255,0.5)] transition-colors"
              />
              <textarea
                value={content}
                onChange={e => setContent(e.target.value.slice(0, charLimit))}
                placeholder="Describe the challenge..."
                className="w-full min-h-[80px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-xl p-4 text-sm resize-none outline-none placeholder:text-muted-foreground focus:border-[rgba(124,111,255,0.5)] transition-colors"
              />
              <div className="grid grid-cols-2 gap-3">
                <select className="h-10 rounded-xl px-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-sm text-foreground">
                  <option className="bg-[#050510]">Domain</option>
                  <option className="bg-[#050510]">Web Dev</option>
                  <option className="bg-[#050510]">Healthcare</option>
                  <option className="bg-[#050510]">Agriculture</option>
                  <option className="bg-[#050510]">IoT</option>
                  <option className="bg-[#050510]">AI/ML</option>
                </select>
                <input
                  value={reward}
                  onChange={e => setReward(e.target.value)}
                  placeholder="Reward (e.g. ₹25,000)"
                  className="h-10 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-xl px-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}

          {type === "Seek collaborator" && (
            <div className="space-y-3">
              <input
                value={roleNeeded}
                onChange={e => setRoleNeeded(e.target.value)}
                placeholder="Role needed (e.g. Backend Developer)"
                className="w-full h-12 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-[rgba(124,111,255,0.5)] transition-colors"
              />
              <input
                value={projectLink}
                onChange={e => setProjectLink(e.target.value)}
                placeholder="Project link or name"
                className="w-full h-12 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-[rgba(124,111,255,0.5)] transition-colors"
              />
              <textarea
                value={content}
                onChange={e => setContent(e.target.value.slice(0, charLimit))}
                placeholder="What they'll get out of it + duration + location..."
                className="w-full min-h-[80px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-xl p-4 text-sm resize-none outline-none placeholder:text-muted-foreground focus:border-[rgba(124,111,255,0.5)] transition-colors"
              />
            </div>
          )}

          {/* Visibility */}
          <div className="glass-card rounded-full px-4 py-2 flex items-center gap-2 mt-4 mb-4">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Visible to</span>
            <select
              value={visibility}
              onChange={e => setVisibility(e.target.value)}
              className="bg-transparent text-xs font-bold text-foreground outline-none"
            >
              <option className="bg-[#050510]">Everyone</option>
              <option className="bg-[#050510]">My Strands</option>
              <option className="bg-[#050510]">Same college</option>
            </select>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                <Link2 className="w-4 h-4 text-muted-foreground" />
              </button>
              <button className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{content.length}/{charLimit}</span>
              <Button variant="default" size="sm" onClick={handlePublish} disabled={publishing}>
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NewPostModal;
