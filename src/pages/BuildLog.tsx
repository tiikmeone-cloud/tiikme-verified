import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, Plus, ExternalLink, Copy, Users, Settings, Eye, UserCheck, Shield, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const workTypes = ["Project", "Job", "Case", "Research", "Trade work", "Community work", "Government scheme", "Other"];
const statusOptions = ["Active", "Completed", "Paused"];

const projects = [
  {
    title: "TelemedicineRx", role: "Backend Lead", status: "active",
    team: "Team of 4 · Delhi Tech University",
    tags: [{ label: "Faculty verified", color: "#00FFB2" }, { label: "Visible: Public", color: "rgba(240,240,255,0.5)" }],
    stats: "Updated 2 days ago · 6 recruiter views this week · 847 total views",
    domain: "HealthTech",
  },
  {
    title: "SmartGrid Monitor", role: "Full Stack", status: "paused",
    team: "Team of 3 · IIT Delhi",
    tags: [{ label: "Visible: Strands only", color: "rgba(240,240,255,0.5)" }],
    stats: "Last updated 3 weeks ago · 200+ users at peak",
    domain: "IoT",
  },
  {
    title: "HealthBridge App", role: "Mobile Developer", status: "completed",
    team: "Team of 5",
    tags: [{ label: "Prof. Sharma approved", color: "#00FFB2" }, { label: "Visible: Public", color: "rgba(240,240,255,0.5)" }],
    stats: "Completed Jan 2025 · 400+ downloads",
    domain: "Health",
  },
];

const AddWorkModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form, setForm] = useState({ title: "", desc: "", type: "", status: "Active", link: "" });
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card rounded-2xl p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-6">Add work to your Build Log</h2>
        <div className="space-y-4 mb-6">
          <Input placeholder="Work / Project title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
          <Input placeholder="One-line description" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
          <div className="grid grid-cols-2 gap-4">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm">
              <option value="" className="bg-[#050510]">Type</option>
              {workTypes.map(t => <option key={t} value={t} className="bg-[#050510]">{t}</option>)}
            </select>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm">
              {statusOptions.map(s => <option key={s} value={s} className="bg-[#050510]">{s}</option>)}
            </select>
          </div>
          <Input placeholder="Link (optional)" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
        </div>
        <Button variant="hero" className="w-full" onClick={() => { toast.success("Work added to your Build Log"); onClose(); }}>Add to Build Log</Button>
      </motion.div>
    </div>
  );
};

const BuildLog = () => {
  const [addOpen, setAddOpen] = useState(false);

  const statusColor = (s: string) => s === "active" ? "#7C6FFF" : s === "paused" ? "#FFB547" : "#00FFB2";
  const statusLabel = (s: string) => s === "completed" ? "Verified Complete" : s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[28px] font-bold">Build Log</h1>
        <Button variant="default" size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" /> Add project
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Every project you've contributed to — tracked, verified, and shareable.</p>

      {/* Explainer */}
      <div className="glass-card rounded-2xl p-4 mb-6" style={{ borderLeft: "4px solid #00FFB2" }}>
        <p className="text-sm text-muted-foreground">
          Your Build Log is your proof of work. Each project card shows recruiter views, faculty verification status, and your specific role. Share via tiikme.in/you/project
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
              borderLeft: `4px solid ${statusColor(project.status)}`,
              background: project.status === "completed" ? "linear-gradient(135deg, rgba(0,255,178,0.03), rgba(255,255,255,0.06))" : undefined,
            }}
          >
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-base font-bold">{project.title}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor(project.status)}22`, color: statusColor(project.status) }}>
                {statusLabel(project.status)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Your role: {project.role} · {project.team}</p>

            <div className="flex items-center gap-2 flex-wrap mb-2">
              {project.tags.map(tag => (
                <span key={tag.label} className="text-[10px] font-bold px-2 py-0.5 rounded-full glass-card flex items-center gap-1" style={{ color: tag.color }}>
                  {tag.color === "#00FFB2" && <Shield className="w-3 h-3" />}
                  {tag.label}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /></span>
              <span>{project.stats}</span>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-border flex-wrap">
              <Button variant="default" size="xs" className="gap-1"><ExternalLink className="w-3 h-3" /> Open project</Button>
              <Button variant="secondary" size="xs" className="gap-1" onClick={() => toast.success("Link copied to clipboard")}><Copy className="w-3 h-3" /> Copy link</Button>
              <Button variant="secondary" size="xs" className="gap-1"><Users className="w-3 h-3" /> Invite member</Button>
              {project.status === "paused" && (
                <Button variant="secondary" size="xs" className="gap-1" onClick={() => toast.success("Project resumed")}><PlayCircle className="w-3 h-3" /> Resume project</Button>
              )}
              {project.status !== "paused" && (
                <Button variant="ghost" size="xs" className="gap-1"><Settings className="w-3 h-3" /> Settings</Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add project dashed */}
      <button
        onClick={() => setAddOpen(true)}
        className="w-full mt-4 border-2 border-dashed border-[rgba(255,255,255,0.12)] rounded-2xl p-5 text-sm text-muted-foreground hover:text-foreground hover:border-[rgba(124,111,255,0.4)] transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Add another project to your Build Log
      </button>

      <AddWorkModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
};

export default BuildLog;
