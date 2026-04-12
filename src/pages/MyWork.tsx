import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Layers, Plus, Copy, Users, Eye, Shield, Target, Briefcase, Wrench,
  BookOpen, GraduationCap, Rocket, Heart, FolderOpen, ArrowRight, Pencil,
  MoreHorizontal, Archive, EyeOff, Trash2, ChevronDown, Link2, Github
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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

const statusColor = (s: string) => s === "active" ? "#10B981" : s === "paused" ? "#F59E0B" : "var(--brand)";
const statusLabel = (s: string) => s === "active" ? "Active" : s === "paused" ? "Paused" : "Completed";
const filterTabs = ["All", "Active", "Completed", "Paused"];

const typeColorMap: Record<string, string> = {
  project: "#4F46E5", software: "#4F46E5", startup: "#7C3AED", job: "#0369A1",
  research: "#0E7490", hardware: "#C2410C", design: "#92400E", internship: "#166534",
  case: "#6B21A8", trade: "#C2410C", community: "#10B981", certificate: "#F59E0B",
  award: "#F59E0B", other: "#6B7280",
};

const AddWorkModal = ({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({ title: "", desc: "", status: "active", link: "", visibility: "public", github: "" });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!form.title.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("work_items").insert({
      owner_id: user.id,
      title: form.title.trim(),
      description: form.desc.trim(),
      type: selectedType || "project",
      status: form.status,
      visibility: form.visibility,
      institution_name: profile?.institution_name || "",
      links: { github: form.github, demo: form.link },
    });
    setSaving(false);
    if (error) { toast.error("Failed to save: " + error.message); return; }
    toast.success("Work added ✓");
    onSaved();
    onClose();
    setStep(1);
    setForm({ title: "", desc: "", status: "active", link: "", visibility: "public", github: "" });
    setSelectedType("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={() => { onClose(); setStep(1); }}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full sm:max-w-lg rounded-t-[24px] sm:rounded-[20px] max-h-[90dvh] overflow-y-auto glass-card"
        onClick={e => e.stopPropagation()}>
        <div className="sm:hidden flex justify-center pt-2 pb-1"><div className="w-10 h-[5px] rounded-full" style={{ background: "var(--border-2)" }} /></div>
        <div className="h-16 flex items-center justify-between px-5 sm:px-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>
            {step === 1 ? "Add to My Work" : `Add ${workTypes.find(w => w.id === selectedType)?.label}`}
          </h2>
          <button type="button" onClick={() => { onClose(); setStep(1); }} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer" style={{ color: "var(--text-3)" }}>✕</button>
        </div>
        <div className="p-5 sm:p-6">
          {step === 1 && (
            <>
              <p className="text-[14px] mb-5" style={{ color: "var(--text-2)" }}>Choose what type of work you want to add.</p>
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {workTypes.map(wt => (
                  <button type="button" key={wt.id} onClick={() => setSelectedType(wt.id)}
                    className="rounded-2xl p-4 text-center cursor-pointer"
                    style={{
                      background: selectedType === wt.id ? "var(--brand-dim)" : "var(--surface-2)",
                      border: selectedType === wt.id ? "1.5px solid var(--brand)" : "1.5px solid var(--border)",
                    }}>
                    <wt.icon className="w-5 h-5 mx-auto mb-2" style={{ color: "var(--brand)" }} />
                    <span className="text-[12px] font-bold block" style={{ color: "var(--text-1)" }}>{wt.label}</span>
                  </button>
                ))}
              </div>
              <Button className="w-full" disabled={!selectedType} onClick={() => setStep(2)}>Continue</Button>
            </>
          )}
          {step === 2 && (
            <>
              <button type="button" onClick={() => setStep(1)} className="text-[13px] font-semibold mb-4 flex items-center gap-1 cursor-pointer" style={{ color: "var(--brand)" }}>← Back</button>
              <div className="space-y-4 mb-5">
                <div><label className="micro-label block mb-1.5">Title</label><Input placeholder="Project or startup name" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div>
                  <label className="micro-label block mb-1.5">Description</label>
                  <textarea placeholder="What does this project do?" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} rows={3}
                    className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                </div>
                <div>
                  <label className="micro-label block mb-1.5">Status</label>
                  <div className="flex gap-2">
                    {["active", "completed", "paused"].map(s => (
                      <button type="button" key={s} onClick={() => setForm({ ...form, status: s })}
                        className="flex-1 h-[38px] rounded-[10px] text-[13px] font-semibold cursor-pointer capitalize"
                        style={{ background: form.status === s ? "var(--brand)" : "var(--surface-2)", color: form.status === s ? "white" : "var(--text-2)", border: form.status === s ? "none" : "1px solid var(--border)" }}>
                        {statusLabel(s)}
                      </button>
                    ))}
                  </div>
                </div>
                {(selectedType === "project" || selectedType === "startup") && (
                  <div className="flex gap-3">
                    <div className="flex-1"><label className="micro-label block mb-1.5">GitHub</label><Input placeholder="github.com/..." value={form.github} onChange={e => setForm({ ...form, github: e.target.value })} /></div>
                    <div className="flex-1"><label className="micro-label block mb-1.5">Demo / Website</label><Input placeholder="https://..." value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} /></div>
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? "Saving..." : "Save work"}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const MyWork = () => {
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [workItems, setWorkItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWork = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("work_items")
      .select("id, title, description, type, status, institution_name, tech_stack, links, visibility, is_tiiked, is_tiik_approved, total_views, recruiter_views, created_at, updated_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.warn("[MyWork] fetch failed:", error.message);
    setWorkItems(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchWork(); }, [fetchWork]);

  const filtered = activeFilter === "All" ? workItems
    : workItems.filter(p => statusLabel(p.status || "active") === activeFilter);

  if (loading) {
    return (
      <div className="max-w-[960px] mx-auto px-3 md:px-6 py-7 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="t-card p-5 animate-pulse">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl" style={{ background: "var(--surface-2)" }} />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 rounded" style={{ background: "var(--surface-2)" }} />
                <div className="h-3 w-60 rounded" style={{ background: "var(--surface-2)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto px-3 md:px-6 py-7">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)" }}>My Work</h1>
        <Button onClick={() => setAddOpen(true)} className="gap-1.5"><Plus className="w-4 h-4" /> Add work</Button>
      </div>
      <p className="text-[13px] mb-5" style={{ color: "var(--text-2)" }}>Your verified professional record</p>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide mb-5 pb-1">
        {filterTabs.map(f => (
          <button type="button" key={f} onClick={() => setActiveFilter(f)}
            className="shrink-0 h-[30px] px-3 rounded-full text-[12px] font-semibold cursor-pointer"
            style={{
              background: activeFilter === f ? "var(--brand)" : "var(--surface-2)",
              color: activeFilter === f ? "white" : "var(--text-2)",
              border: activeFilter === f ? "none" : "1px solid var(--border)",
            }}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Layers className="w-14 h-14 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
          <p className="text-[18px] font-bold mb-1" style={{ color: "var(--text-2)" }}>Nothing here yet!</p>
          <p className="text-[14px] mb-4" style={{ color: "var(--text-3)" }}>Add your first project, job, or achievement.</p>
          <Button onClick={() => setAddOpen(true)}>Add your first project</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((project, i) => {
            const color = typeColorMap[project.type || "project"] || "#6B7280";
            return (
              <motion.div key={project.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="t-card t-card-hover flex flex-col relative" style={{ borderLeft: `4px solid ${statusColor(project.status || "active")}` }}>
                <div className="flex items-start justify-between p-4 pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}14` }}>
                      <Layers className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>{project.title}</h3>
                      <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{(project.type || "project").charAt(0).toUpperCase() + (project.type || "project").slice(1)}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: `${statusColor(project.status || "active")}18`, color: statusColor(project.status || "active") }}>
                    {statusLabel(project.status || "active")}
                  </span>
                </div>
                {project.description && (
                  <p className="text-[12px] px-4 mt-1.5 line-clamp-2" style={{ color: "var(--text-3)" }}>{project.description}</p>
                )}
                <div className="flex items-center gap-2 px-4 mt-1.5 text-[11px]" style={{ color: "var(--text-3)" }}>
                  {project.institution_name && <span>{project.institution_name}</span>}
                  {project.tech_stack?.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{project.tech_stack[0]}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-4 mt-2">
                  {project.is_tiik_approved && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>✓ Tiik Approved</span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--brand-dim)", color: "var(--brand)" }}>
                    {(project.visibility || "public").charAt(0).toUpperCase() + (project.visibility || "public").slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-3 px-4 mt-2.5 text-[11px]" style={{ color: "var(--text-3)" }}>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {project.total_views || 0} views</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {project.recruiter_views || 0} recruiter</span>
                </div>
                <div className="flex items-center gap-2 p-4 mt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate(`/app/work/${project.id}`)}>
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/app/work/${project.id}`); toast.success("Link copied"); }}
                    className="ml-auto flex items-center gap-1 text-[12px] font-semibold cursor-pointer" style={{ color: "var(--brand)" }}>
                    <Copy className="w-3 h-3" /> Share
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AddWorkModal open={addOpen} onClose={() => setAddOpen(false)} onSaved={fetchWork} />
    </div>
  );
};

export default MyWork;
