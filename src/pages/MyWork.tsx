import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, Plus, Copy, Users, Eye, Shield, Target, Briefcase, Wrench,
  BookOpen, GraduationCap, Rocket, Heart, FolderOpen, ArrowRight, Pencil,
  MoreHorizontal, Archive, EyeOff, Trash2, ChevronDown, Link2, Github
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { tiikToast } from "@/components/ui/tiik-toast";

const workTypes = [
  { id: "project", label: "Project", icon: Layers, desc: "Software, hardware, or creative project" },
  { id: "startup", label: "Startup", icon: Rocket, desc: "Your own business or product" },
  { id: "job", label: "Job / Role", icon: Briefcase, desc: "Employment or freelance role" },
  { id: "case", label: "Case Study", icon: Target, desc: "A documented study or analysis" },
  { id: "trade", label: "Trade Job", icon: Wrench, desc: "Skilled trade work completed" },
  { id: "community", label: "Community Work", icon: Heart, desc: "Volunteering or social impact" },
  { id: "research", label: "Research", icon: BookOpen, desc: "Academic research or paper" },
  { id: "certificate", label: "Certificate", icon: GraduationCap, desc: "Course or certification earned" },
  { id: "award", label: "Achievement / Award", icon: Shield, desc: "An award or recognition" },
];

const projects = [
  { title: "TelemedicineRx", role: "Backend Lead", status: "active", team: "Team of 4", institution: "Delhi Tech University", type: "Project", tags: [{ label: "Tiik Approved", gold: true }, { label: "Public", gold: false }], stats: "847 views", recruiterViews: 6, updated: "2 days ago", domain: "HealthTech", hubId: "telemedicinerx", color: "#0E7490" },
  { title: "SmartGrid Monitor", role: "Full Stack", status: "paused", team: "Team of 3", institution: "IIT Delhi", type: "Project", tags: [{ label: "Strands only", gold: false }], stats: "200 views", recruiterViews: 2, updated: "3 weeks ago", domain: "IoT", hubId: "smartgrid", color: "#4F46E5" },
  { title: "HealthBridge App", role: "Mobile Developer", status: "completed", team: "Team of 5", institution: "", type: "Project", tags: [{ label: "Tiik Approved", gold: true }, { label: "Public", gold: false }], stats: "1.2K views", recruiterViews: 12, updated: "Jan 2025", domain: "Health", hubId: null, color: "#10B981" },
];

const statusColor = (s: string) => s === "active" ? "#10B981" : s === "paused" ? "#F59E0B" : "var(--brand)";
const statusLabel = (s: string) => s === "active" ? "Active" : s === "paused" ? "Paused" : "Completed";
const filterTabs = ["All", "Active", "Completed", "Paused", "Awaiting Approval"];

const AddWorkModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({ title: "", desc: "", status: "Active", link: "", visibility: "Public", github: "" });
  const [currentlyWorking, setCurrentlyWorking] = useState(true);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={() => { onClose(); setStep(1); }}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full sm:max-w-lg rounded-t-[24px] sm:rounded-[20px] max-h-[90dvh] overflow-y-auto glass-card"
        onClick={e => e.stopPropagation()}>
        {/* Drag handle mobile */}
        <div className="sm:hidden flex justify-center pt-2 pb-1"><div className="w-10 h-[5px] rounded-full" style={{ background: "var(--border-2)" }} /></div>

        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 sm:px-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>
            {step === 1 ? "Add to My Work" : step === 2 ? `Add ${workTypes.find(w => w.id === selectedType)?.label}` : "Request Tiik Approval"}
          </h2>
          <button onClick={() => { onClose(); setStep(1); }} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer" style={{ color: "var(--text-3)" }}>✕</button>
        </div>

        <div className="p-5 sm:p-6">
          {step === 1 && (
            <>
              <p className="text-[14px] mb-5" style={{ color: "var(--text-2)" }}>Choose what type of work you want to add.</p>
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {workTypes.map(wt => (
                  <button key={wt.id} onClick={() => { setSelectedType(wt.id); }}
                    className="rounded-2xl p-4 text-center cursor-pointer"
                    style={{
                      background: selectedType === wt.id ? "var(--brand-dim)" : "var(--surface-2)",
                      border: selectedType === wt.id ? "1.5px solid var(--brand)" : "1.5px solid var(--border)",
                      transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                      boxShadow: selectedType === wt.id ? "0 0 0 1px var(--brand-dim), 0 4px 20px var(--brand-glow)" : "none",
                    }}>
                    {selectedType === wt.id && <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px]" style={{ background: "var(--brand)" }}>✓</div>}
                    <wt.icon className="w-5 h-5 mx-auto mb-2" style={{ color: "var(--brand)" }} />
                    <span className="text-[12px] font-bold block" style={{ color: "var(--text-1)" }}>{wt.label}</span>
                    <span className="text-[10px] mt-0.5 block" style={{ color: "var(--text-3)" }}>{wt.desc}</span>
                  </button>
                ))}
              </div>
              <Button className="w-full" size="xl" disabled={!selectedType} onClick={() => setStep(2)}>Continue</Button>
            </>
          )}

          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} className="text-[13px] font-semibold mb-4 flex items-center gap-1 cursor-pointer" style={{ color: "var(--brand)" }}>← Back</button>
              <div className="space-y-4 mb-5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-3)" }}>Title</label>
                  <Input placeholder="Project or startup name" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-3)" }}>Description</label>
                  <textarea placeholder="What does this project do?" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} rows={3}
                    className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none"
                    style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)", transition: "border 0.15s" }}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--brand)"}
                    onBlur={e => e.currentTarget.style.borderColor = "var(--border-2)"}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-3)" }}>Status</label>
                  <div className="flex gap-2">
                    {["Active", "Completed", "Paused"].map(s => (
                      <button key={s} onClick={() => setForm({ ...form, status: s })}
                        className="flex-1 h-[38px] rounded-[10px] text-[13px] font-semibold cursor-pointer"
                        style={{
                          background: form.status === s ? "var(--brand)" : "var(--surface-2)",
                          color: form.status === s ? "white" : "var(--text-2)",
                          border: form.status === s ? "none" : "1px solid var(--border)",
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                {(selectedType === "job" || selectedType === "trade") && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[13px]" style={{ color: "var(--text-2)" }}>I currently work here</span>
                    <button onClick={() => setCurrentlyWorking(!currentlyWorking)}
                      className="w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer"
                      style={{ background: currentlyWorking ? "var(--brand)" : "var(--border-2)", transition: "all 0.2s" }}>
                      <div className="w-5 h-5 rounded-full bg-white" style={{ transition: "transform 0.2s", transform: currentlyWorking ? "translateX(20px)" : "translateX(0)" }} />
                    </button>
                  </div>
                )}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-3)" }}>Visibility</label>
                  <div className="flex gap-2">
                    {["Public", "Strands only", "Private"].map(v => (
                      <button key={v} onClick={() => setForm({ ...form, visibility: v })}
                        className="flex-1 h-[38px] rounded-[10px] text-[13px] font-semibold cursor-pointer"
                        style={{
                          background: form.visibility === v ? "var(--brand)" : "var(--surface-2)",
                          color: form.visibility === v ? "white" : "var(--text-2)",
                          border: form.visibility === v ? "none" : "1px solid var(--border)",
                        }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                {(selectedType === "project" || selectedType === "startup") && (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-3)" }}>GitHub</label>
                      <Input placeholder="github.com/..." value={form.github} onChange={e => setForm({ ...form, github: e.target.value })} />
                    </div>
                    <div className="flex-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-3)" }}>Demo / Website</label>
                      <Input placeholder="https://..." value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => { tiikToast("Draft saved"); onClose(); setStep(1); }}>Save draft</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Next: Verification</Button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <button onClick={() => setStep(2)} className="text-[13px] font-semibold mb-4 flex items-center gap-1 cursor-pointer" style={{ color: "var(--brand)" }}>← Back</button>
              <p className="text-[14px] mb-5" style={{ color: "var(--text-2)" }}>Ask your head/manager to verify this work for a gold Tiik Approved badge.</p>
              <div className="t-card p-4 mb-5 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold text-white" style={{ backgroundColor: "#92400E", boxShadow: "0 0 0 2px var(--surface), 0 0 0 4.5px #F59E0B, 0 0 12px rgba(245,158,11,0.45)" }}>PS</div>
                <div>
                  <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Prof. Sharma</p>
                  <p className="text-[12px]" style={{ color: "var(--text-2)" }}>HOD, Computer Science · DTU</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => { tiikToast.success("Work added"); onClose(); setStep(1); }}>Skip for now</Button>
                <Button className="flex-1" onClick={() => { tiikToast.success("Verification request sent & work added"); onClose(); setStep(1); }}>Send request</Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const MyWork = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filtered = activeFilter === "All" ? projects
    : activeFilter === "Awaiting Approval" ? []
    : projects.filter(p => statusLabel(p.status) === activeFilter);

  return (
    <div className="max-w-[960px] mx-auto px-3 md:px-6 py-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)", letterSpacing: "-0.01em" }}>My Work</h1>
        <Button onClick={() => setAddOpen(true)} className="gap-1.5"><Plus className="w-4 h-4" /> Add work</Button>
      </div>
      <p className="text-[13px] mb-5" style={{ color: "var(--text-2)" }}>Your verified professional record</p>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-5 pb-1">
        {filterTabs.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className="shrink-0 h-[30px] px-3 rounded-full text-[12px] font-semibold cursor-pointer"
            style={{
              background: activeFilter === f ? "var(--brand)" : "var(--surface-2)",
              color: activeFilter === f ? "white" : "var(--text-2)",
              border: activeFilter === f ? "none" : "1px solid var(--border)",
              transition: "all 0.15s",
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Layers className="w-14 h-14 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
          <p className="text-[18px] font-bold mb-1" style={{ color: "var(--text-2)" }}>Nothing here yet!</p>
          <p className="text-[14px] mb-4" style={{ color: "var(--text-3)" }}>Add your first project, job, or achievement.</p>
          <Button onClick={() => setAddOpen(true)}>Add your first project</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((project, i) => (
            <motion.div key={project.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="t-card t-card-hover flex flex-col relative" style={{ borderLeft: `4px solid ${statusColor(project.status)}` }}>
              {/* Header */}
              <div className="flex items-start justify-between p-4 pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${project.color}14` }}>
                    <Layers className="w-5 h-5" style={{ color: project.color }} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>{project.title}</h3>
                    <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{project.role}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${statusColor(project.status)}18`, color: statusColor(project.status) }}>
                  {statusLabel(project.status)}
                </span>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 px-4 mt-1 text-[11px]" style={{ color: "var(--text-3)" }}>
                <span>{project.team}</span>
                {project.institution && <><span>·</span><Link to="/app/institution/1" className="hover:underline" style={{ color: "var(--brand)" }}>{project.institution}</Link></>}
                <span>·</span>
                <span className="px-1.5 py-0.5 rounded-md" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{project.domain}</span>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-1.5 px-4 mt-2">
                {project.tags.map(t => (
                  <span key={t.label} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={t.gold
                    ? { backgroundColor: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }
                    : { backgroundColor: "var(--brand-dim)", color: "var(--brand)" }}>
                    {t.gold ? "✓ " : ""}{t.label}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 px-4 mt-2.5 text-[11px]" style={{ color: "var(--text-3)" }}>
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {project.stats}</span>
                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {project.recruiterViews} recruiter views</span>
                <span className="ml-auto text-[10px]">Updated {project.updated}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 p-4 mt-2" style={{ borderTop: "1px solid var(--border)" }}>
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => tiikToast("Opening editor...")}>
                  <Pencil className="w-3 h-3" /> Edit
                </Button>
                {project.hubId && (
                  <Link to={`/app/teams/${project.hubId}`} className="flex items-center gap-1 text-[12px] font-semibold ml-auto" style={{ color: "var(--brand)" }}>
                    View Hub <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
                <div className="relative">
                  <Button variant="ghost" size="sm" className="w-7 h-7 p-0" onClick={() => setMenuOpen(menuOpen === project.title ? null : project.title)}>
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                  {menuOpen === project.title && (
                    <div className="absolute right-0 top-8 z-10 w-44 rounded-xl p-1" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)", boxShadow: "var(--shadow-lg)" }}>
                      <button className="w-full text-left px-3 py-2 rounded-lg text-[13px] flex items-center gap-2 cursor-pointer" style={{ color: "var(--text-2)", transition: "all 0.15s" }} onClick={() => { setMenuOpen(null); tiikToast("Archived"); }}>
                        <Archive className="w-3.5 h-3.5" /> Archive
                      </button>
                      <button className="w-full text-left px-3 py-2 rounded-lg text-[13px] flex items-center gap-2 cursor-pointer" style={{ color: "var(--text-2)", transition: "all 0.15s" }} onClick={() => { setMenuOpen(null); tiikToast("Visibility toggled"); }}>
                        <EyeOff className="w-3.5 h-3.5" /> Toggle visibility
                      </button>
                      <button className="w-full text-left px-3 py-2 rounded-lg text-[13px] flex items-center gap-2 cursor-pointer" style={{ color: "#DC2626", transition: "all 0.15s" }} onClick={() => { setMenuOpen(null); tiikToast.error("Deleted"); }}>
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dashed add card */}
      <button onClick={() => setAddOpen(true)} className="w-full mt-5 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer flex items-center justify-center gap-2"
        style={{ borderColor: "var(--border-2)", color: "var(--text-3)", transition: "all 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brand)"; e.currentTarget.style.background = "var(--brand-dim)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-2)"; e.currentTarget.style.background = "transparent"; }}>
        <Plus className="w-5 h-5" /> <span className="text-[13px] font-semibold">Add work, project, or achievement</span>
      </button>

      <AddWorkModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
};

export default MyWork;
