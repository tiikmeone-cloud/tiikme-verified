import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, Plus, ExternalLink, Copy, Users, Settings, Eye, Shield, PlayCircle, Target, Briefcase, Wrench, BookOpen, GraduationCap, Rocket, Heart, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const workTypes = [
  { id: "project", label: "Project", icon: Layers },
  { id: "research", label: "Research", icon: BookOpen },
  { id: "job", label: "Job / Role", icon: Briefcase },
  { id: "case", label: "Case Study", icon: Target },
  { id: "trade", label: "Trade Job", icon: Wrench },
  { id: "community", label: "Community Work", icon: Heart },
  { id: "startup", label: "Startup", icon: Rocket },
  { id: "course", label: "Course / Training", icon: GraduationCap },
  { id: "award", label: "Achievement / Award", icon: Shield },
];

const projects = [
  { title: "TelemedicineRx", role: "Backend Lead", status: "active", team: "Team of 4 · Delhi Tech University", type: "Project", tags: [{ label: "Tiik ✓", gold: true }, { label: "Public", gold: false }], stats: "Updated 2 days ago · 6 recruiter views · 847 total views", domain: "HealthTech" },
  { title: "SmartGrid Monitor", role: "Full Stack", status: "paused", team: "Team of 3 · IIT Delhi", type: "Project", tags: [{ label: "Strands only", gold: false }], stats: "Last updated 3 weeks ago · 200+ users", domain: "IoT" },
  { title: "HealthBridge App", role: "Mobile Developer", status: "completed", team: "Team of 5", type: "Project", tags: [{ label: "Tiik ✓", gold: true }, { label: "Public", gold: false }], stats: "Completed Jan 2025 · 400+ downloads", domain: "Health" },
];

const statusColor = (s: string) => s === "active" ? "#10B981" : s === "paused" ? "#F59E0B" : "hsl(var(--brand))";

const AddWorkModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [step, setStep] = useState<"type" | "details" | "verify">("type");
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({ title: "", desc: "", status: "Active", link: "", visibility: "Public" });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={() => { onClose(); setStep("type"); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="t-card p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {step === "type" && (
          <>
            <h2 className="text-xl font-bold text-t1 mb-2">Add work to My Work</h2>
            <p className="text-sm text-t2 mb-6">Choose what type of work you want to add.</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {workTypes.map(wt => (
                <button key={wt.id} onClick={() => { setSelectedType(wt.id); setStep("details"); }}
                  className="t-card p-4 text-left hover:border-brand transition-colors">
                  <wt.icon className="w-5 h-5 text-brand mb-2" />
                  <span className="text-xs font-bold text-t1 block">{wt.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {step === "details" && (
          <>
            <h2 className="text-xl font-bold text-t1 mb-6">Add {workTypes.find(w => w.id === selectedType)?.label}</h2>
            <div className="space-y-4 mb-6">
              <Input placeholder="Title (required)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-11 bg-surface-2 border-border" />
              <textarea placeholder="Description (required)" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} rows={3} className="w-full bg-surface-2 border border-border rounded-[10px] p-4 text-sm outline-none resize-none placeholder:text-t3 text-t1" />
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-11 rounded-[10px] px-3 bg-surface-2 border border-border text-t1 text-sm">
                {["Active", "Completed", "Paused"].map(s => <option key={s}>{s}</option>)}
              </select>
              <Input placeholder="Link — GitHub, demo, portfolio (optional)" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="h-11 bg-surface-2 border-border" />
              <select value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })} className="w-full h-11 rounded-[10px] px-3 bg-surface-2 border border-border text-t1 text-sm">
                <option>Public</option><option>Strands only</option><option>Private</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep("type")} className="flex-1">Back</Button>
              <Button onClick={() => setStep("verify")} className="flex-1">Next: Verification</Button>
            </div>
          </>
        )}
        {step === "verify" && (
          <>
            <h2 className="text-xl font-bold text-t1 mb-2">Request Tiik Approval</h2>
            <p className="text-sm text-t2 mb-6">Ask your head/manager to verify this work item.</p>
            <div className="t-card p-4 mb-6">
              <p className="text-sm text-t1 font-bold">Prof. Sharma</p>
              <p className="text-xs text-t2">HOD, Computer Science · DTU</p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => { toast.success("Work added to My Work"); onClose(); setStep("type"); }} className="flex-1">Skip — I'll request later</Button>
              <Button onClick={() => { toast.success("Request sent & work added"); onClose(); setStep("type"); }} className="flex-1">Send request</Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

const MyWork = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 py-7">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[20px] font-bold text-t1">My Work</h1>
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> Add work</Button>
      </div>
      <p className="text-[13px] text-t2 mb-6">Your verified professional record — shareable at tiikme.in/arjunkumar</p>

      {!dismissed && (
        <div className="t-card p-4 mb-6 relative" style={{ borderLeft: "4px solid hsl(var(--brand))" }}>
          <button onClick={() => setDismissed(true)} className="absolute top-3 right-3 text-t3 hover:text-t1">✕</button>
          <p className="text-sm text-t2">Every item here is your proof. Recruiters, clients, and collaborators find you through this. Tiik-approved items show a verified badge.</p>
        </div>
      )}

      <div className="space-y-3">
        {projects.map((project, i) => (
          <motion.div key={project.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="t-card p-5" style={{ borderLeft: `4px solid ${statusColor(project.status)}` }}>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Layers className="w-4 h-4 text-t3" />
              <h3 className="text-[15px] font-bold text-t1">{project.title}</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor(project.status)}20`, color: statusColor(project.status) }}>
                {project.status === "completed" ? "Completed" : project.status === "active" ? "Active" : "Paused"}
              </span>
              {project.tags.some(t => t.gold) && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.15)] text-[#F59E0B]">Tiik ✓</span>}
            </div>
            <p className="text-xs text-t2 mb-2">Your role: {project.role} · {project.team}</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-t2">{project.domain}</span>
              {project.tags.filter(t => !t.gold).map(t => (
                <span key={t.label} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-2 border border-border text-t3">{t.label}</span>
              ))}
            </div>
            <p className="text-[11px] text-t3 mb-3 flex items-center gap-1"><Eye className="w-3 h-3" /> {project.stats}</p>
            <div className="flex items-center gap-2 pt-3 border-t border-border flex-wrap">
              <Button variant="secondary" size="xs" className="gap-1"><ExternalLink className="w-3 h-3" /> Open</Button>
              <Button variant="secondary" size="xs" className="gap-1" onClick={() => { navigator.clipboard.writeText(`https://tiikme.in/arjunkumar/${project.title.toLowerCase().replace(/\s+/g, '-')}`); toast.success("Link copied"); }}><Copy className="w-3 h-3" /> Copy link</Button>
              <Button variant="secondary" size="xs" className="gap-1" onClick={() => toast.info("Opening invite...")}><Users className="w-3 h-3" /> Invite</Button>
              <Button variant="ghost" size="xs" className="gap-1 ml-auto"><Settings className="w-3 h-3" /></Button>
            </div>
          </motion.div>
        ))}
      </div>

      <button onClick={() => setAddOpen(true)} className="w-full mt-4 border-2 border-dashed border-border rounded-2xl p-5 text-sm text-t3 hover:text-t1 hover:border-brand transition-all flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Add another item to My Work
      </button>

      <AddWorkModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
};

export default MyWork;
