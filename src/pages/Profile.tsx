import { useState } from "react";
import { MapPin, Copy, Pencil, Download, Shield, Layers, Users, X, Camera, MessageCircle, CheckCircle, Calendar, ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/EmptyState";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const tabs = ["Portfolio", "Posts", "About", "Verifications"] as const;
const ROLE_COLOR = "#4F46E5";

const mockProjects = [
  { title: "TelemedicineRx", company: "Delhi Tech University", location: "Delhi, India", description: "Telemedicine platform for rural India with AI triage and offline-first sync", domain: "HealthTech", status: "active" as const, role: "Lead Developer", startDate: "Jan 2025", endDate: "Present", tech: ["React Native", "Supabase", "Python", "TensorFlow"], tiikApproved: true },
  { title: "SmartGrid Monitor", company: "IIT Delhi Research Lab", location: "Delhi, India", description: "IoT dashboard for electrical grid monitoring across 4 states with real-time anomaly detection", domain: "IoT", status: "completed" as const, role: "Frontend Engineer", startDate: "Aug 2024", endDate: "Dec 2024", tech: ["React", "Node.js", "MQTT", "D3.js"], tiikApproved: false },
  { title: "EduBridge App", company: "Self / Open Source", location: "Remote", description: "Vernacular learning platform for government school students in rural districts", domain: "EdTech", status: "completed" as const, role: "Full Stack Developer", startDate: "Mar 2024", endDate: "Jul 2024", tech: ["Next.js", "PostgreSQL"], tiikApproved: true },
];

const mockGroups = [
  { name: "CodeCraft Club", initials: "CC", color: "#0369A1", members: 12, activeProjects: 3, description: "A community of builders shipping real products every month.", creator: "Arjun Kumar", memberAvatars: ["AK", "PM", "RS", "NS", "DT"] },
  { name: "EduTech Builders", initials: "EB", color: "#92400E", members: 28, activeProjects: 5, description: "Open-source collective focused on education technology for Bharat.", creator: "Priya Mehta", memberAvatars: ["PM", "AK", "VK", "SS"] },
];

const totalYears = () => {
  const start = new Date("2024-03-01");
  const now = new Date();
  const diff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
  return Math.max(1, Math.round(diff * 10) / 10);
};

const EditProfileModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form, setForm] = useState({ name: "Arjun Kumar", headline: "Final year CSE student building at the intersection of health and technology.", bio: "", city: "Delhi", state: "Delhi" });
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full sm:max-w-lg rounded-t-[20px] sm:rounded-2xl p-6 sm:p-8 max-h-[85vh] overflow-y-auto border border-border/30"
        style={{ background: "var(--surface)", boxShadow: "0 24px 48px rgba(0,0,0,0.3)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center -mt-2 mb-4"><div className="w-9 h-[5px] rounded-full" style={{ background: "var(--border-2)" }} /></div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-extrabold text-t1">Edit profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-t3 hover:text-t1 cursor-pointer active:scale-95 transition-all duration-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          {[{ label: "Display name", val: form.name, key: "name" }, { label: "Headline", val: form.headline, key: "headline" }].map(f => (
            <div key={f.key}>
              <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1">{f.label}</label>
              <Input value={f.val} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="h-11 bg-surface-2 border-border/30 focus:ring-2 focus:ring-brand" />
            </div>
          ))}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1">Bio</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell people about yourself..." rows={3} className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none bg-surface-2 border border-border/30 text-t1 placeholder:text-t3 focus:border-brand transition-all duration-200" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1">City</label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="h-11 bg-surface-2 border-border/30" /></div>
            <div><label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1">State</label><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="h-11 bg-surface-2 border-border/30" /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1 active:scale-95 transition-all duration-200 hover:bg-surface-2" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 active:scale-95 transition-all duration-200" onClick={() => { toast.success("Profile updated"); onClose(); }}>Save changes</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const GroupModal = ({ group, onClose }: { group: typeof mockGroups[0] | null; onClose: () => void }) => {
  if (!group) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-md rounded-3xl border p-6 overflow-y-auto max-h-[80vh]"
        style={{ background: "var(--surface)", borderColor: "var(--border-2)", boxShadow: "var(--card-shadow)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[18px] font-bold text-white" style={{ backgroundColor: group.color }}>{group.initials}</div>
            <div>
              <h2 className="text-[18px] font-extrabold text-t1">{group.name}</h2>
              <p className="text-[12px] text-t3">{group.members} members · {group.activeProjects} active projects</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-t3 hover:text-t1 cursor-pointer active:scale-95"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-t3 mb-1">DESCRIPTION</p>
            <p className="text-[14px] text-t1 leading-relaxed">{group.description}</p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-t3 mb-2">TEAM MEMBERS</p>
            <div className="space-y-2">
              {group.memberAvatars.map((av, i) => (
                <Link key={i} to="/app/profile" className="flex items-center gap-3 rounded-xl p-3 border border-border/30 hover:border-brand/30 transition-all duration-200 cursor-pointer active:scale-[0.99]" style={{ background: "var(--surface-2)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ backgroundColor: group.color }}>{av}</div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-t1">{av === "AK" ? "Arjun Kumar" : `Member ${av}`}</p>
                    <p className="text-[11px] text-t3">Contributor</p>
                  </div>
                  {av === group.creator.split(" ").map(n => n[0]).join("") && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>Admin</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const handleExport = () => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) { toast.error("Pop-up blocked"); return; }
  printWindow.document.write(`
    <!DOCTYPE html><html><head><title>Arjun Kumar — Tiikme Profile</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; padding: 48px; color: #1a1a2e; }
      h1 { font-size: 28px; margin-bottom: 4px; }
      .meta { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
      h2 { font-size: 18px; margin: 28px 0 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
      .item { margin-bottom: 16px; padding-left: 16px; border-left: 3px solid #4F46E5; }
      .item h3 { font-size: 15px; font-weight: 700; }
      .item .role { font-size: 13px; color: #6b7280; }
      .item .desc { font-size: 13px; margin-top: 4px; color: #374151; }
      .badge { display: inline-block; font-size: 10px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 99px; font-weight: 700; }
      .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
      @media print { body { padding: 24px; } }
    </style></head><body>
    <h1>Arjun Kumar</h1>
    <p class="meta">Student · DTU · Delhi, India · @arjunkumar</p>
    <p style="font-size:14px;color:#374151;margin-bottom:8px;">Final year CSE student building at the intersection of health and technology.</p>
    <h2>Work & Projects</h2>
    ${mockProjects.map(p => `
      <div class="item">
        <h3>${p.title} ${p.tiikApproved ? '<span class="badge">Tiik Approved</span>' : ''}</h3>
        <p class="role">${p.role} @ ${p.company} · ${p.startDate} – ${p.endDate} · ${p.domain}</p>
        <p class="desc">${p.description}</p>
      </div>
    `).join("")}
    <h2>Groups</h2>
    ${mockGroups.map(g => `<p style="font-size:13px;margin-bottom:4px;">${g.name} — ${g.members} members, ${g.activeProjects} active projects</p>`).join("")}
    <div class="footer">Generated via Tiikme.in · Verified Professional Identity</div>
    </body></html>
  `);
  printWindow.document.close();
  printWindow.print();
};

const Profile = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Portfolio");
  const [editOpen, setEditOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<typeof mockGroups[0] | null>(null);

  const handleExportWithSpinner = () => {
    setExporting(true);
    setTimeout(() => {
      handleExport();
      setExporting(false);
      toast.success("Profile PDF downloaded with Tiikme watermark.");
    }, 1000);
  };

  const handleCopyLink = () => { navigator.clipboard.writeText("https://tiikme.in/arjunkumar"); toast.success("Link copied!"); };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* ========== FROSTED GLASS HERO CARD ========== */}
      <div className="rounded-3xl overflow-hidden relative w-full h-[400px] md:h-[500px]" style={{ boxShadow: "var(--card-shadow)" }}>
        {/* Background image (placeholder gradient) */}
        <div className="absolute inset-0 w-full h-full" style={{
          background: `linear-gradient(160deg, ${ROLE_COLOR}, #0E7490, #10B981)`,
        }}>
          <div className="w-full h-full flex items-center justify-center text-[120px] font-extrabold text-white/20 select-none">
            AK
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to top, #050510 0%, rgba(5,5,16,0.6) 50%, transparent 100%)"
        }} />

        {/* Edit button */}
        <button
          onClick={() => setEditOpen(true)}
          className="absolute top-4 right-4 p-2.5 rounded-xl cursor-pointer active:scale-95 transition-all duration-200 z-10"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          <Camera className="w-4 h-4 text-white" />
        </button>

        {/* Frosted bottom section */}
        <div className="absolute bottom-0 w-full p-6 md:p-8" style={{ backdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(5,5,16,0.3)" }}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[26px] md:text-[30px] font-extrabold text-white">Arjun Kumar</h1>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(245,158,11,0.2)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
                  <Shield className="w-3 h-3" /> Tiik Approved
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ROLE_COLOR}33`, color: "#a5b4fc" }}>Student</span>
              </div>
              <p className="text-[12px] font-mono mt-1 text-white/40">@arjunkumar</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10B981" }} />
                <span className="text-[12px] font-medium text-[#10B981]">Open to work</span>
              </div>
              <p className="text-[14px] md:text-[15px] mt-3 text-white/80 leading-relaxed line-clamp-2">Final year CSE student building at the intersection of health and technology.</p>

              {/* Connectivity Nodes */}
              <div className="flex items-center gap-2 flex-wrap mt-3">
                <Link to="/app/institution/1" className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer" style={{ background: "rgba(79,70,229,0.15)", color: "#a5b4fc", border: "1px solid rgba(79,70,229,0.2)" }}>
                  <MapPin className="w-3 h-3 inline mr-1" />DTU
                </Link>
                <Link to="/app/explore" className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <Layers className="w-3 h-3 inline mr-1" />TelemedicineRx
                </Link>
                <span className="text-[11px] px-3 py-1.5 rounded-full text-white/50" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>Delhi, India</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="secondary" size="sm" className="gap-1.5 rounded-full active:scale-95 transition-all duration-200 text-white border-white/20 hover:bg-white/10" style={{ background: "rgba(255,255,255,0.08)" }} onClick={handleCopyLink}><Copy className="w-3 h-3" /> Copy link</Button>
              <Button variant="secondary" size="sm" className="gap-1.5 rounded-full active:scale-95 transition-all duration-200 text-white border-white/20 hover:bg-white/10" style={{ background: "rgba(255,255,255,0.08)" }} onClick={() => setEditOpen(true)}><Pencil className="w-3 h-3" /></Button>
              <Button size="sm" className="gap-1.5 rounded-full active:scale-95 transition-all duration-200" onClick={handleExportWithSpinner}>
                <Download className="w-3 h-3" /> {exporting ? "Exporting..." : "Export"}
              </Button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {[{ label: "PROJECTS", value: "4" }, { label: "GROUPS", value: "2" }, { label: "STRANDS", value: "156" }, { label: "ACTIVITY", value: "78" }].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[20px] font-extrabold text-white">{s.value}</p>
                <p className="text-[9px] font-bold tracking-wider uppercase text-white/35">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========== TABS ========== */}
      <div className="rounded-2xl border border-border/30 overflow-hidden" style={{ background: "var(--surface)" }}>
        <div className="flex border-b border-border/30 px-7">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 text-[13px] font-semibold relative transition-all duration-200 cursor-pointer ${activeTab === tab ? "text-brand" : "text-t2 hover:text-t1"}`}>
              {tab}
              {activeTab === tab && <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand rounded-full" />}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ========== PORTFOLIO TAB ========== */}
          {activeTab === "Portfolio" && (
            <div>
              {/* Experience summary */}
              <div className="rounded-xl border border-border/30 p-4 mb-5 flex items-center gap-3" style={{ background: "var(--surface-2)" }}>
                <Globe className="w-5 h-5 text-brand shrink-0" />
                <div>
                  <p className="text-[14px] font-bold text-t1">Total Experience: {totalYears()} Years</p>
                  <p className="text-[12px] text-t3">{mockProjects.length} projects across {[...new Set(mockProjects.map(p => p.domain))].length} domains</p>
                </div>
              </div>

              <div className="space-y-0">
                {mockProjects.map((p, i) => (
                  <div key={p.title} className="flex gap-4 group">
                    {/* Timeline */}
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-3 h-3 rounded-full shrink-0 border-2" style={{
                        borderColor: p.status === "active" ? "#10B981" : "var(--brand)",
                        background: p.status === "active" ? "#10B981" : "var(--brand)",
                      }} />
                      {i < mockProjects.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "var(--border-2)" }} />}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-[15px] font-bold text-t1">{p.role} @ {p.company}</h3>
                            {p.tiikApproved && (
                              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>
                                <Shield className="w-3 h-3" /> Tiik Approved
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-[12px] text-t3">
                            <MapPin className="w-3 h-3" />
                            <span>{p.location}</span>
                            <span className="mx-0.5">|</span>
                            <Calendar className="w-3 h-3" />
                            <span>{p.startDate} – {p.endDate}</span>
                          </div>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95 shrink-0 h-8 w-8 p-0">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View full project details</TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-[14px] text-t2 leading-relaxed mt-2 line-clamp-2">{p.description}</p>
                      {/* Skills pills */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {p.tech.map(t => (
                          <span key={t} className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)", border: "1px solid var(--brand-glow)" }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Posts" && (
            <EmptyState icon={MessageCircle} title="No posts yet" description="Share your first update — a project milestone, an insight, or a question." actionLabel="Share your first update" onAction={() => toast.info("Opening compose...")} />
          )}

          {/* ========== ABOUT TAB (Groups as floating glass) ========== */}
          {activeTab === "About" && (
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase text-t3 mb-3">MY GROUPS</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mockGroups.map(g => (
                    <div
                      key={g.name}
                      onClick={() => setSelectedGroup(g)}
                      className="rounded-2xl p-5 cursor-pointer hover:-translate-y-1 transition-all duration-300 active:scale-[0.98]"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[14px] font-bold text-white" style={{ backgroundColor: g.color }}>{g.initials}</div>
                        <div>
                          <p className="text-[14px] font-bold text-t1">{g.name}</p>
                          <p className="text-[11px] text-t3">{g.activeProjects} active projects</p>
                        </div>
                      </div>
                      {/* Overlapping avatars */}
                      <div className="flex items-center">
                        {g.memberAvatars.slice(0, 4).map((av, i) => (
                          <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2" style={{ backgroundColor: g.color, borderColor: "var(--surface)", marginLeft: i > 0 ? "-8px" : "0", zIndex: 4 - i }}>
                            {av}
                          </div>
                        ))}
                        {g.members > 4 && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold border-2 -ml-2" style={{ background: "var(--surface-2)", borderColor: "var(--surface)", color: "var(--text-2)" }}>
                            +{g.members - 4}
                          </div>
                        )}
                        <span className="text-[11px] text-t3 ml-3">{g.members} members</span>
                      </div>
                    </div>
                  ))}
                  <div className="rounded-2xl p-5 flex items-center justify-center cursor-pointer hover:border-brand/30 transition-all duration-200 active:scale-[0.99]" style={{ border: "2px dashed var(--border-2)" }}>
                    <span className="text-[13px] font-semibold text-t3">+ Create or join a group</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Verifications" && (
            <div className="space-y-1">
              {[{ level: "Phone", status: "Verified", color: "#10B981" }, { level: "Email", status: "Verified", color: "#10B981" }, { level: "Institution", status: "DTU — Verified", color: "#F59E0B" }, { level: "Tiik Approval", status: "Approved by Prof. Kumar", color: "#F59E0B" }].map(v => (
                <div key={v.level} className="flex items-center justify-between py-3 border-b border-border/30 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4" style={{ color: v.color }} />
                    <span className="text-[14px] text-t1">{v.level}</span>
                  </div>
                  <span className="text-[12px] font-bold" style={{ color: v.color }}>{v.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
      <AnimatePresence>
        {selectedGroup && <GroupModal group={selectedGroup} onClose={() => setSelectedGroup(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
