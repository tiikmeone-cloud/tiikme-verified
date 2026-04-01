import { useState } from "react";
import { MapPin, Copy, Shield, Layers, Users, X, Settings, MessageCircle, CheckCircle, Calendar, Globe, ThumbsUp, Lightbulb, FileText, Image, Clock, Send, Share2, ArrowRight } from "lucide-react";
import ActivityScoreRing from "@/components/ActivityScoreRing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/EmptyState";

const tabs = ["Portfolio", "Posts", "Verifications"] as const;
const ROLE_COLOR = "#4F46E5";

const mockProjects = [
  { title: "TelemedicineRx", company: "Delhi Tech University", location: "Delhi, India", description: "Telemedicine platform for rural India with AI triage and offline-first sync", domain: "HealthTech", status: "active" as const, role: "Lead Developer", startDate: "Jan 2025", endDate: "Present", tech: ["React Native", "Supabase", "Python", "TensorFlow"], tiikApproved: true, anchor: "Prof. Sharma", anchorStatus: "verified" as const, teamSize: 4, hubId: "telemedicinerx" },
  { title: "SmartGrid Monitor", company: "IIT Delhi Research Lab", location: "Delhi, India", description: "IoT dashboard for electrical grid monitoring across 4 states with real-time anomaly detection", domain: "IoT", status: "completed" as const, role: "Frontend Engineer", startDate: "Aug 2024", endDate: "Dec 2024", tech: ["React", "Node.js", "MQTT", "D3.js"], tiikApproved: false, anchor: "Dr. Verma", anchorStatus: "pending" as const, teamSize: 3, hubId: "smartgrid" },
  { title: "EduBridge App", company: "Self / Open Source", location: "Remote", description: "Vernacular learning platform for government school students in rural districts", domain: "EdTech", status: "completed" as const, role: "Full Stack Developer", startDate: "Mar 2024", endDate: "Jul 2024", tech: ["Next.js", "PostgreSQL"], tiikApproved: true, anchor: null, anchorStatus: "none" as const, teamSize: 1, hubId: null },
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
        style={{ background: "var(--surface)", boxShadow: "var(--card-shadow)" }}
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

type ProjectType = typeof mockProjects[number];

const VerificationModal = ({ project, onClose }: { project: ProjectType | null; onClose: () => void }) => {
  if (!project) return null;
  const inviteText = `Hi ${project.anchor}, I've added our project "${project.title}" to Tiikme. Please verify my contribution here: https://tiikme.in/verify-invite?project=${encodeURIComponent(project.title)}&from=arjunkumar`;

  const handleCopy = () => { navigator.clipboard.writeText(inviteText); toast.success("Invite text copied!"); };
  const handleWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, "_blank"); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-md rounded-3xl border p-6 bg-white/70 dark:bg-[#111118]/80 backdrop-blur-2xl border-white/30 dark:border-white/10"
        style={{ boxShadow: "var(--card-shadow)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)" }}>
              <Shield className="w-5 h-5" style={{ color: "#F59E0B" }} />
            </div>
            <h2 className="text-[18px] font-extrabold text-t1">Get Tiik Approved</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-t3 hover:text-t1 cursor-pointer active:scale-95"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-[14px] text-t2 leading-relaxed mb-5">Send this link to your Project Head or Manager. Once they verify, your project receives the official Tiik Approved badge.</p>
        <div className="rounded-xl border border-border/30 p-4 mb-5" style={{ background: "var(--surface-2)" }}>
          <p className="text-[13px] text-t1 leading-relaxed select-all">{inviteText}</p>
        </div>
        <div className="flex gap-3">
          <Button className="flex-1 gap-2 active:scale-95 transition-all duration-200" onClick={handleCopy}><Copy className="w-4 h-4" /> Copy Link</Button>
          <Button variant="secondary" className="flex-1 gap-2 active:scale-95 transition-all duration-200" onClick={handleWhatsApp} style={{ background: "#25D366", color: "white", border: "none" }}><Share2 className="w-4 h-4" /> WhatsApp</Button>
        </div>
      </motion.div>
    </div>
  );
};

const Profile = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Portfolio");
  const [editOpen, setEditOpen] = useState(false);
  const [verifyProject, setVerifyProject] = useState<ProjectType | null>(null);

  const handleCopyLink = () => { navigator.clipboard.writeText("https://tiikme.in/arjunkumar"); toast.success("Link copied!"); };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* ========== LIQUID GLOSSY HERO CARD ========== */}
      <div className="rounded-3xl overflow-hidden relative w-full h-[400px] md:h-[500px]" style={{ boxShadow: "var(--card-shadow)" }}>
        <div className="absolute inset-0 w-full h-full" style={{ background: `linear-gradient(160deg, ${ROLE_COLOR}, #0E7490, #10B981)` }}>
          <div className="w-full h-full flex items-center justify-center text-[120px] font-extrabold text-white/20 select-none">AK</div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/40 to-transparent dark:from-[#050510] dark:via-[#050510]/60 dark:to-transparent" />

        <button onClick={() => setEditOpen(true)} className="absolute top-4 right-4 p-2.5 rounded-xl cursor-pointer active:scale-95 transition-all duration-200 z-10 bg-white/20 dark:bg-white/10 backdrop-blur-xl border border-white/30 dark:border-white/15">
          <Settings className="w-4 h-4 text-white" />
        </button>

        <div className="absolute bottom-0 w-full p-6 md:p-8 backdrop-blur-xl bg-white/40 border-t border-white/60 dark:bg-[#050510]/30 dark:border-t dark:border-white/10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-[26px] md:text-[30px] font-extrabold text-gray-900 dark:text-white">Arjun Kumar</h1>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(245,158,11,0.2)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
                  <Shield className="w-3 h-3" /> Tiik Approved
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ROLE_COLOR}20`, color: ROLE_COLOR }}>Student</span>
              </div>
              <p className="text-[12px] font-mono mt-1 text-gray-500 dark:text-white/40">@arjunkumar</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10B981" }} />
                <span className="text-[12px] font-medium" style={{ color: "#10B981" }}>Open to work</span>
              </div>
              <p className="text-[14px] md:text-[15px] mt-3 text-gray-700 dark:text-white/80 leading-relaxed line-clamp-2">Final year CSE student building at the intersection of health and technology.</p>
              <div className="flex items-center gap-2 flex-wrap mt-3">
                <Link to="/app/institution/1" className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer" style={{ background: "var(--brand-dim)", color: "var(--brand)", border: "1px solid var(--brand-glow)" }}>
                  <MapPin className="w-3 h-3 inline mr-1" />DTU
                </Link>
                <Link to="/app/teams/telemedicinerx" className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20">
                  <Layers className="w-3 h-3 inline mr-1" />TelemedicineRx
                </Link>
                <span className="text-[11px] px-3 py-1.5 rounded-full text-gray-500 dark:text-white/50 bg-gray-100 dark:bg-white/8 border border-gray-200 dark:border-white/10">Delhi, India</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm" className="gap-1.5 rounded-full active:scale-95 transition-all duration-200 text-gray-600 dark:text-white/70 hover:bg-gray-200/50 dark:hover:bg-white/10" onClick={handleCopyLink}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-gray-200/60 dark:border-white/8">
            {[{ label: "PROJECTS", value: "3" }, { label: "TEAMS", value: "2" }, { label: "STRANDS", value: "156" }].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[20px] font-extrabold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-[9px] font-bold tracking-wider uppercase text-gray-400 dark:text-white/35">{s.label}</p>
              </div>
            ))}
            <div className="text-center">
              <ActivityScoreRing score={78} size={48} strokeWidth={4} trend="" percentile="" />
            </div>
          </div>
        </div>
      </div>

      {/* ========== TABS ========== */}
      <div className="glass-card overflow-hidden">
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
          {/* ========== PORTFOLIO TAB — Chronological Vertical Timeline ========== */}
          {activeTab === "Portfolio" && (
            <div>
              <div className="rounded-xl border border-border/30 p-4 mb-5 flex items-center gap-3" style={{ background: "var(--surface-2)" }}>
                <Globe className="w-5 h-5 text-brand shrink-0" />
                <div>
                  <p className="text-[14px] font-bold text-t1">Total Experience: {totalYears()} Years</p>
                  <p className="text-[12px] text-t3">{mockProjects.length} projects across {[...new Set(mockProjects.map(p => p.domain))].length} domains</p>
                </div>
              </div>

              <div className="space-y-0">
                {mockProjects.map((p, i) => (
                  <div key={p.title} className="flex gap-4">
                    {/* Timeline left column */}
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-3 h-3 rounded-full shrink-0 border-2" style={{
                        borderColor: p.status === "active" ? "#10B981" : "var(--brand)",
                        background: p.status === "active" ? "#10B981" : "var(--brand)",
                      }} />
                      {i < mockProjects.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "var(--border-2)" }} />}
                    </div>

                    {/* Right column — Liquid Glossy Card */}
                    <div className="flex-1 pb-5">
                      <div className="rounded-xl p-4 border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5
                        bg-white/40 backdrop-blur-xl border-white/60 shadow-sm
                        dark:bg-white/4 dark:border-white/8 dark:backdrop-blur-xl">

                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-[15px] font-bold text-t1">{p.role} <span className="font-extrabold">@ {p.company}</span></h3>
                          {p.tiikApproved && (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>
                              <Shield className="w-3 h-3" /> Tiik Approved
                            </span>
                          )}
                          {!p.tiikApproved && p.anchor && p.anchorStatus === "pending" && (
                            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400">
                              <Clock className="w-3 h-3" /> Awaiting Approval
                            </span>
                          )}
                        </div>

                        {/* Anchor line */}
                        {p.anchor ? (
                          <div className="mt-1.5">
                            <p className="text-[12px]" style={{ color: "var(--brand)" }}>
                              <Shield className="w-3 h-3 inline mr-1" />
                              Verified by: {p.anchor}
                            </p>
                            {p.anchorStatus === "pending" && (
                              <button onClick={() => setVerifyProject(p)} className="text-[11px] font-medium mt-0.5 cursor-pointer hover:underline transition-all duration-200 active:scale-95" style={{ color: "var(--brand)" }}>
                                <Send className="w-3 h-3 inline mr-1" />Resend verification invite
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full mt-1.5" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>Independent Project</span>
                        )}

                        <div className="flex items-center gap-1.5 mt-2 text-[12px] text-t3">
                          <MapPin className="w-3 h-3" /><span>{p.location}</span>
                          <span className="mx-0.5">|</span>
                          <Calendar className="w-3 h-3" /><span>{p.startDate} – {p.endDate}</span>
                        </div>

                        <p className="text-[14px] text-t2 leading-relaxed mt-2 line-clamp-2">{p.description}</p>

                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {p.tech.map(t => (
                            <span key={t} className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)", border: "1px solid var(--brand-glow)" }}>{t}</span>
                          ))}
                        </div>

                        {/* View Project Hub link */}
                        {p.hubId && (
                          <Link to={`/app/teams/${p.hubId}`} className="inline-flex items-center gap-1.5 mt-3 text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg px-3 py-1.5 transition-all duration-200 active:scale-95">
                            View Project Hub <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
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
        {verifyProject && <VerificationModal project={verifyProject} onClose={() => setVerifyProject(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
