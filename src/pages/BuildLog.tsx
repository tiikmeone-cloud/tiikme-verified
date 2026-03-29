import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, Plus, ExternalLink, Copy, Users, Settings, Eye, Shield, PlayCircle, Target, Briefcase, Wrench, BookOpen, GraduationCap, Rocket, Heart, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const workTypes = [
  { id: "project", label: "Project", icon: Layers },
  { id: "research", label: "Research", icon: BookOpen },
  { id: "job", label: "Job / Role", icon: Briefcase },
  { id: "case", label: "Case Study", icon: Target },
  { id: "trade", label: "Installation / Trade work", icon: Wrench },
  { id: "community", label: "Community work", icon: Heart },
  { id: "startup", label: "Startup", icon: Rocket },
  { id: "course", label: "Course / Training", icon: GraduationCap },
];
const statusOptions = ["Active", "Completed", "Paused"];

const projects = [
  {
    title: "TelemedicineRx", role: "Backend Lead", status: "active",
    team: "Team of 4 · Delhi Tech University", type: "Project",
    tags: [{ label: "Head Approved", color: "#00FFB2" }, { label: "Visible: Public", color: "rgba(240,240,255,0.5)" }],
    stats: "Updated 2 days ago · 6 recruiter views this week · 847 total views",
    domain: "HealthTech",
  },
  {
    title: "SmartGrid Monitor", role: "Full Stack", status: "paused",
    team: "Team of 3 · IIT Delhi", type: "Project",
    tags: [{ label: "Visible: Strands only", color: "rgba(240,240,255,0.5)" }],
    stats: "Last updated 3 weeks ago · 200+ users at peak",
    domain: "IoT",
  },
  {
    title: "HealthBridge App", role: "Mobile Developer", status: "completed",
    team: "Team of 5", type: "Project",
    tags: [{ label: "Prof. Sharma approved", color: "#00FFB2" }, { label: "Visible: Public", color: "rgba(240,240,255,0.5)" }],
    stats: "Completed Jan 2025 · 400+ downloads",
    domain: "Health",
  },
];

const AddWorkModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [step, setStep] = useState<"type" | "details">("type");
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({ title: "", desc: "", status: "Active", link: "" });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => { onClose(); setStep("type"); setSelectedType(""); }}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card rounded-2xl p-8 max-w-lg w-full" onClick={e => e.stopPropagation()}>
        {step === "type" ? (
          <>
            <h2 className="text-xl font-bold mb-2">Add work to My Work</h2>
            <p className="text-sm text-muted-foreground mb-6">Choose what type of work you want to add.</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {workTypes.map(wt => (
                <button
                  key={wt.id}
                  onClick={() => { setSelectedType(wt.id); setStep("details"); }}
                  className="glass-card rounded-xl p-4 text-left transition-all hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)]"
                >
                  <wt.icon className="w-6 h-6 text-electric mb-2" />
                  <span className="text-sm font-bold block">{wt.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-6">Add {workTypes.find(w => w.id === selectedType)?.label}</h2>
            <div className="space-y-4 mb-6">
              <Input placeholder="Title (required)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
              <textarea placeholder="Description (required)" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} rows={3} className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] rounded-xl p-4 text-sm outline-none resize-none placeholder:text-muted-foreground" />
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm">
                {statusOptions.map(s => <option key={s} value={s} className="bg-[#050510]">{s}</option>)}
              </select>
              <Input placeholder="Link — GitHub, demo, portfolio (optional)" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep("type")} className="flex-1">Back</Button>
              <Button variant="default" onClick={() => { toast.success("Work added to My Work"); onClose(); setStep("type"); setSelectedType(""); }} className="flex-1">Add to My Work</Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

const MyWork = () => {
  const [addOpen, setAddOpen] = useState(false);

  const statusColor = (s: string) => s === "active" ? "#7C6FFF" : s === "paused" ? "#FFB547" : "#00FFB2";
  const statusLabel = (s: string) => s === "completed" ? "Verified Complete" : s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Layers className="w-7 h-7 text-electric" />
          <h1 className="text-[28px] font-bold">My Work</h1>
        </div>
        <Button variant="default" size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" /> Add work
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Your verified professional record — shareable at tiikme.in/arjunkumar</p>

      {/* Explainer */}
      <div className="glass-card rounded-2xl p-4 mb-6" style={{ borderLeft: "4px solid #00FFB2" }}>
        <p className="text-sm text-muted-foreground">
          Every item in My Work is your proof. Recruiters, clients, and collaborators find you through this. Head-approved items show a verified badge.
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
              <Button variant="default" size="xs" className="gap-1"><ExternalLink className="w-3 h-3" /> Open</Button>
              <Button variant="secondary" size="xs" className="gap-1" onClick={() => { navigator.clipboard.writeText(`https://tiikme.in/arjunkumar/${project.title.toLowerCase().replace(/\s+/g, '-')}`); toast.success("Link copied to clipboard"); }}><Copy className="w-3 h-3" /> Copy link</Button>
              <Button variant="secondary" size="xs" className="gap-1" onClick={() => toast.info("Opening invite...")}><Users className="w-3 h-3" /> Invite</Button>
              {project.status === "paused" && (
                <Button variant="secondary" size="xs" className="gap-1" onClick={() => toast.success("Project resumed")}><PlayCircle className="w-3 h-3" /> Resume</Button>
              )}
              <Button variant="ghost" size="xs" className="gap-1 ml-auto"><Settings className="w-3 h-3" /></Button>
            </div>
          </motion.div>
        ))}
      </div>

      <button
        onClick={() => setAddOpen(true)}
        className="w-full mt-4 border-2 border-dashed border-[rgba(255,255,255,0.12)] rounded-2xl p-5 text-sm text-muted-foreground hover:text-foreground hover:border-[rgba(124,111,255,0.4)] transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Add another item to My Work
      </button>

      <AddWorkModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
};

export default MyWork;
