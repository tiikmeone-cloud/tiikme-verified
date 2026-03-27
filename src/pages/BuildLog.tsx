import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, Plus, ExternalLink, Copy, Users, Settings, Eye, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const workTypes = ["Project", "Job", "Case", "Research", "Trade work", "Community work", "Government scheme", "Other"];
const statusOptions = ["Active", "Completed", "Paused"];

const projects = [
  { title: "TelemedicineRx", role: "Lead Developer", status: "active", views: 234, recruiterViews: 12, updated: "2 days ago", domain: "HealthTech" },
  { title: "SmartGrid Monitor", role: "Frontend Dev", status: "completed", views: 567, recruiterViews: 28, updated: "1 week ago", domain: "IoT" },
  { title: "Village Connect App", role: "Full Stack", status: "paused", views: 89, recruiterViews: 3, updated: "3 weeks ago", domain: "Social Impact" },
];

const AddWorkModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form, setForm] = useState({ title: "", desc: "", type: "", status: "Active", link: "" });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card rounded-2xl p-8 max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-6">Add work to your Build Log</h2>
        <div className="space-y-4 mb-6">
          <Input placeholder="Work / Project title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
          <Input placeholder="One-line description" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
          <div className="grid grid-cols-2 gap-4">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm">
              <option value="" className="bg-background">Type</option>
              {workTypes.map(t => <option key={t} value={t} className="bg-background">{t}</option>)}
            </select>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm">
              {statusOptions.map(s => <option key={s} value={s} className="bg-background">{s}</option>)}
            </select>
          </div>
          <Input placeholder="Link (optional)" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
        </div>
        <Button variant="hero" className="w-full" onClick={() => { toast.success("Work added to your Build Log"); onClose(); }}>
          Add to Build Log
        </Button>
      </motion.div>
    </div>
  );
};

const BuildLog = () => {
  const [addOpen, setAddOpen] = useState(false);

  const statusColor = (s: string) => {
    if (s === "active") return "#7C6FFF";
    if (s === "paused") return "#FFB547";
    return "#00FFB2";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-bold">Build Log</h1>
        <Button variant="default" size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" /> Add work
        </Button>
      </div>

      {/* Explainer */}
      <div className="glass-card rounded-2xl p-4 mb-6" style={{ borderLeft: "3px solid #00FFB2" }}>
        <p className="text-sm text-muted-foreground">
          Every piece of work you've contributed to — tracked, verified, and shareable via your link.
        </p>
      </div>

      <div className="space-y-4">
        {projects.map((project, i) => (
          <motion.div
            key={project.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-2xl p-5"
            style={{
              borderLeft: `3px solid ${statusColor(project.status)}`,
              background: project.status === "completed" ? "linear-gradient(135deg, rgba(0,255,178,0.03), rgba(255,255,255,0.06))" : undefined,
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-bold">{project.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: `${statusColor(project.status)}22`, color: statusColor(project.status) }}>
                    {project.status}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full glass-card text-muted-foreground">{project.domain}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Your role: {project.role}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {project.views} views</span>
                  <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {project.recruiterViews} recruiter</span>
                  <span>Updated {project.updated}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
              <Button variant="ghost" size="xs" className="gap-1"><ExternalLink className="w-3 h-3" /> Open</Button>
              <Button variant="ghost" size="xs" className="gap-1" onClick={() => { toast.success("Link copied to clipboard"); }}><Copy className="w-3 h-3" /> Copy link</Button>
              <Button variant="ghost" size="xs" className="gap-1"><Users className="w-3 h-3" /> Invite</Button>
              <Button variant="ghost" size="xs" className="gap-1"><Settings className="w-3 h-3" /> Settings</Button>
            </div>
          </motion.div>
        ))}
      </div>

      <AddWorkModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
};

export default BuildLog;
