import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, Plus, ExternalLink, Copy, Users, Eye, Shield, Target, Briefcase, Wrench, BookOpen, GraduationCap, Rocket, Heart, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import SkeletonCard from "@/components/SkeletonCard";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  { title: "TelemedicineRx", role: "Backend Lead", status: "active", team: "Team of 4", institution: "Delhi Tech University", type: "Project", tags: [{ label: "Tiik Approved", gold: true }, { label: "Public", gold: false }], stats: "6 recruiter views", updated: "2 days ago", domain: "HealthTech" },
  { title: "SmartGrid Monitor", role: "Full Stack", status: "paused", team: "Team of 3", institution: "IIT Delhi", type: "Project", tags: [{ label: "Strands only", gold: false }], stats: "200+ users", updated: "3 weeks ago", domain: "IoT" },
  { title: "HealthBridge App", role: "Mobile Developer", status: "completed", team: "Team of 5", institution: "", type: "Project", tags: [{ label: "Tiik Approved", gold: true }, { label: "Public", gold: false }], stats: "400+ downloads", updated: "Jan 2025", domain: "Health" },
];

const statusColor = (s: string) => s === "active" ? "#10B981" : s === "paused" ? "#F59E0B" : "var(--brand)";
const statusLabel = (s: string) => s === "active" ? "Active" : s === "paused" ? "Paused" : "Completed";

const AddWorkModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [step, setStep] = useState<"type" | "details" | "verify">("type");
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({ title: "", desc: "", status: "Active", link: "", visibility: "Public" });
  const [dragOver, setDragOver] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }} onClick={() => { onClose(); setStep("type"); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full sm:max-w-lg rounded-t-[20px] sm:rounded-2xl border border-border/30 p-6 sm:p-8 max-h-[85vh] overflow-y-auto"
        style={{ background: "var(--surface)", boxShadow: "0 24px 48px rgba(0,0,0,0.3)" }}
        onClick={e => e.stopPropagation()}>
        <div className="sm:hidden flex justify-center -mt-2 mb-4"><div className="w-9 h-[5px] rounded-full" style={{ background: "var(--border-2)" }} /></div>

        {step === "type" && (
          <>
            <h2 className="text-xl font-bold text-t1 mb-2">Add work to Workspace</h2>
            <p className="text-sm text-t2 mb-6">Choose what type of work you want to add.</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {workTypes.map(wt => (
                <button key={wt.id} onClick={() => { setSelectedType(wt.id); setStep("details"); }}
                  className="rounded-xl border border-border/30 p-4 text-left hover:border-brand transition-all duration-200 active:scale-95 cursor-pointer" style={{ background: "var(--surface)" }}>
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
            <div className="space-y-4 mb-4">
              <Input placeholder="Title (required)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="h-11 bg-surface-2 border-border/30 focus:ring-2 focus:ring-brand" />
              <textarea placeholder="Description (required)" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} rows={3} className="w-full bg-surface-2 border border-border/30 rounded-xl p-4 text-sm outline-none resize-none placeholder:text-t3 text-t1 focus:border-brand transition-all duration-200" />
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={() => { setDragOver(false); toast.info("File upload simulated"); }}
                className={`rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${dragOver ? "border-2 border-solid border-brand bg-brand-dim" : "border-2 border-dashed border-border/30"}`}
              >
                <FolderOpen className="w-6 h-6 mx-auto mb-2 text-t3" />
                <p className="text-[12px] text-t3">Drag files here or click to upload</p>
              </div>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-11 rounded-xl px-3 bg-surface-2 border border-border/30 text-t1 text-sm cursor-pointer">
                {["Active", "Completed", "Paused"].map(s => <option key={s}>{s}</option>)}
              </select>
              <Input placeholder="Link — GitHub, demo, portfolio (optional)" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="h-11 bg-surface-2 border-border/30" />
              <select value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })} className="w-full h-11 rounded-xl px-3 bg-surface-2 border border-border/30 text-t1 text-sm cursor-pointer">
                <option>Public</option><option>Strands only</option><option>Private</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep("type")} className="flex-1 active:scale-95 transition-all duration-200 hover:bg-surface-2">Back</Button>
              <Button onClick={() => setStep("verify")} className="flex-1 active:scale-95 transition-all duration-200">Next: Verification</Button>
            </div>
          </>
        )}
        {step === "verify" && (
          <>
            <h2 className="text-xl font-bold text-t1 mb-2">Request Tiik Approval</h2>
            <p className="text-sm text-t2 mb-6">Ask your head/manager to verify this work item.</p>
            <div className="rounded-xl border border-border/30 p-4 mb-6" style={{ background: "var(--surface-2)" }}>
              <p className="text-sm text-t1 font-bold">Prof. Sharma</p>
              <p className="text-xs text-t2">HOD, Computer Science · DTU</p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => { toast.success("Work added to Workspace"); onClose(); setStep("type"); }} className="flex-1 active:scale-95 transition-all duration-200 hover:bg-surface-2">Skip</Button>
              <Button onClick={() => { toast.success("Request sent & work added"); onClose(); setStep("type"); }} className="flex-1 active:scale-95 transition-all duration-200">Send request</Button>
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
  const [loading] = useState(false);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-7"><SkeletonCard count={3} /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-7">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[20px] font-bold text-t1">Workspace</h1>
        <Button size="sm" className="gap-1.5 active:scale-95 transition-all duration-200" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> Add work</Button>
      </div>
      <p className="text-[13px] text-t2 mb-6">Your private drafting board. Manage your portfolio, check analytics, and set visibility before showcasing on your public profile.</p>

      {!dismissed && (
        <div className="rounded-xl border border-border/30 p-4 mb-6 relative" style={{ background: "var(--surface)", borderLeft: "3px solid var(--brand)" }}>
          <button onClick={() => setDismissed(true)} className="absolute top-3 right-3 text-t3 hover:text-t1 transition-colors cursor-pointer active:scale-95">
            <span className="text-[14px]">×</span>
          </button>
          <p className="text-sm text-t2 pr-6">Every item here is your proof. Recruiters, clients, and collaborators find you through this. Tiik-approved items show a verified badge.</p>
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState icon={Layers} title="Nothing here yet!" description="Add your first project, job, or achievement to build your verified portfolio." actionLabel="Add your first project" onAction={() => setAddOpen(true)} />
      ) : (
        <div className="rounded-2xl border border-border/30 overflow-hidden" style={{ background: "var(--surface)", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
          {projects.map((project, i) => (
            <motion.div key={project.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 px-5 py-4 border-b border-border/30 last:border-b-0 hover:bg-surface-2/50 transition-all duration-200 cursor-pointer group">
              <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: statusColor(project.status) }} />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${statusColor(project.status)}14` }}>
                <Layers className="w-4 h-4" style={{ color: statusColor(project.status) }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-bold text-t1 truncate">{project.title}</h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${statusColor(project.status)}18`, color: statusColor(project.status) }}>
                    {statusLabel(project.status)}
                  </span>
                  {project.tags.some(t => t.gold) && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>Tiik Approved</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-t3 mt-0.5">
                  <span>{project.role}</span><span>·</span><span>{project.team}</span>
                  {project.institution && <><span>·</span><span>{project.institution}</span></>}
                  <span>·</span><span className="px-1.5 py-0 rounded bg-surface-2 text-t2">{project.domain}</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-t3 shrink-0">
                <Eye className="w-3 h-3" /><span>{project.stats}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 active:scale-95" onClick={e => { e.stopPropagation(); window.open("#", "_blank"); }}><ExternalLink className="w-3 h-3" /></Button>
                </TooltipTrigger><TooltipContent>View full project details</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 active:scale-95" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(`https://tiikme.in/arjunkumar/${project.title.toLowerCase().replace(/\s+/g, '-')}`); toast.success("Link copied"); }}><Copy className="w-3 h-3" /></Button>
                </TooltipTrigger><TooltipContent>Copy link</TooltipContent></Tooltip>
                <Tooltip><TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 active:scale-95" onClick={e => { e.stopPropagation(); toast.info("Opening invite..."); }}><Users className="w-3 h-3" /></Button>
                </TooltipTrigger><TooltipContent>Invite team</TooltipContent></Tooltip>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <button onClick={() => setAddOpen(true)} className="w-full mt-4 border-2 border-dashed border-border/30 rounded-2xl p-5 text-sm text-t3 hover:text-t1 hover:border-brand transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer">
        <Plus className="w-4 h-4" /> Add another item to Workspace
      </button>

      <AddWorkModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
};

export default MyWork;
