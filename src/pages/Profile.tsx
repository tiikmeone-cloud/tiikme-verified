import { useState } from "react";
import { MapPin, Copy, Shield, Layers, Users, X, Settings, MessageCircle, CheckCircle, Calendar, Globe, Send, Share2, ArrowRight, Building2, Languages, ExternalLink, Clock, Eye, Briefcase, Plus } from "lucide-react";
import ActivityScoreRing from "@/components/ActivityScoreRing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/EmptyState";

const tabs = ["Work", "Posts", "About", "Verifications"] as const;
const ROLE_COLOR = "#4F46E5";
const ROLE_LABEL = "Student";

const mockProjects = [
  { title: "TelemedicineRx", company: "Delhi Tech University", location: "Delhi, India", description: "Telemedicine platform for rural India with AI triage and offline-first sync", domain: "HealthTech", status: "active" as const, role: "Lead Developer", startDate: "Jan 2025", endDate: "Present", tech: ["React Native", "Supabase", "Python", "TensorFlow"], tiikApproved: true, anchor: "Prof. Sharma", anchorStatus: "verified" as const, teamSize: 4, hubId: "telemedicinerx", views: 847, recruiterViews: 6 },
  { title: "SmartGrid Monitor", company: "IIT Delhi Research Lab", location: "Delhi, India", description: "IoT dashboard for electrical grid monitoring across 4 states with real-time anomaly detection", domain: "IoT", status: "completed" as const, role: "Frontend Engineer", startDate: "Aug 2024", endDate: "Dec 2024", tech: ["React", "Node.js", "MQTT", "D3.js"], tiikApproved: false, anchor: "Dr. Verma", anchorStatus: "pending" as const, teamSize: 3, hubId: "smartgrid", views: 312, recruiterViews: 2 },
  { title: "EduBridge App", company: "Self / Open Source", location: "Remote", description: "Vernacular learning platform for government school students in rural districts", domain: "EdTech", status: "completed" as const, role: "Full Stack Developer", startDate: "Mar 2024", endDate: "Jul 2024", tech: ["Next.js", "PostgreSQL"], tiikApproved: true, anchor: null, anchorStatus: "none" as const, teamSize: 1, hubId: null, views: 189, recruiterViews: 1 },
];

const statusColors: Record<string, { dot: string; accent: string; label: string }> = {
  active: { dot: "var(--brand)", accent: "var(--open-green)", label: "Active" },
  completed: { dot: "var(--open-green)", accent: "var(--brand)", label: "Completed" },
  paused: { dot: "#F59E0B", accent: "#F59E0B", label: "Paused" },
};

const EditProfileModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form, setForm] = useState({ name: "Arjun Kumar", headline: "Final year CSE student building at the intersection of health and technology.", bio: "", city: "Delhi", state: "Delhi" });
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full sm:max-w-lg rounded-t-[24px] sm:rounded-[20px] p-6 sm:p-8 max-h-[85vh] overflow-y-auto glass-card"
        onClick={e => e.stopPropagation()}>
        <div className="sm:hidden flex justify-center -mt-2 mb-4"><div className="w-10 h-[5px] rounded-full" style={{ background: "var(--border-2)" }} /></div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)" }}>Edit profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg cursor-pointer active:scale-95" style={{ color: "var(--text-3)" }}><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          {[{ label: "Display name", val: form.name, key: "name" }, { label: "Headline", val: form.headline, key: "headline" }].map(f => (
            <div key={f.key}>
              <label className="micro-label block mb-1.5">{f.label}</label>
              <Input value={f.val} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
            </div>
          ))}
          <div>
            <label className="micro-label block mb-1.5">Bio</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell people about yourself..." rows={3}
              className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none transition-all duration-150"
              style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="micro-label block mb-1.5">City</label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="micro-label block mb-1.5">State</label><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={() => { toast.success("Profile updated"); onClose(); }}>Save changes</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const VerificationModal = ({ project, onClose }: { project: typeof mockProjects[0] | null; onClose: () => void }) => {
  if (!project) return null;
  const inviteText = `Hi ${project.anchor}, I've added our project "${project.title}" to Tiikme. Please verify: https://tiikme.in/verify-invite?project=${encodeURIComponent(project.title)}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className="w-full max-w-md glass-card p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)" }}><Shield className="w-5 h-5" style={{ color: "#F59E0B" }} /></div>
            <h2 className="text-[18px] font-extrabold" style={{ color: "var(--text-1)" }}>Get Tiik Approved</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-5 h-5" /></button>
        </div>
        <p className="text-[14px] leading-relaxed mb-5" style={{ color: "var(--text-2)" }}>Send this link to your Project Head. Once verified, your project gets the Tiik Approved badge.</p>
        <div className="rounded-xl p-4 mb-5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <p className="text-[13px] leading-relaxed select-all" style={{ color: "var(--text-1)" }}>{inviteText}</p>
        </div>
        <div className="flex gap-3">
          <Button className="flex-1 gap-2" onClick={() => { navigator.clipboard.writeText(inviteText); toast.success("Copied!"); }}><Copy className="w-4 h-4" /> Copy</Button>
          <Button variant="secondary" className="flex-1 gap-2" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, "_blank")} style={{ background: "#25D366", color: "white", border: "none" }}><Share2 className="w-4 h-4" /> WhatsApp</Button>
        </div>
      </motion.div>
    </div>
  );
};

const Profile = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Work");
  const [editOpen, setEditOpen] = useState(false);
  const [verifyProject, setVerifyProject] = useState<typeof mockProjects[0] | null>(null);

  const handleCopyLink = () => { navigator.clipboard.writeText("https://tiikme.in/arjunkumar"); toast.success("Link copied!"); };

  return (
    <div className="max-w-[760px] mx-auto px-0 md:px-4 py-0 md:py-7 space-y-0">
      {/* ═══ PROFILE HERO CARD ═══ */}
      <div className="t-card overflow-hidden relative" style={{ borderRadius: "0px", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        {/* Role-colored decorative band */}
        <div className="h-[100px] md:h-[100px] relative" style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${ROLE_COLOR} 40%, var(--surface)) 0%, color-mix(in srgb, ${ROLE_COLOR} 15%, var(--surface)) 50%, var(--surface) 100%)`,
        }}>
          {/* Decorative dots */}
          <div className="absolute right-8 top-4 w-10 h-10 rounded-full" style={{ background: ROLE_COLOR, opacity: 0.08, filter: "blur(12px)" }} />
          <div className="absolute right-20 top-8 w-8 h-8 rounded-full" style={{ background: ROLE_COLOR, opacity: 0.06, filter: "blur(10px)" }} />
          <div className="absolute right-32 top-3 w-6 h-6 rounded-full" style={{ background: ROLE_COLOR, opacity: 0.05, filter: "blur(8px)" }} />

          {/* Verification badge top-right */}
          <div className="absolute top-3 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B" }}>
            <Shield className="w-3 h-3" /> Tiik Approved by DTU
          </div>
        </div>

        {/* Profile info section */}
        <div className="px-6 pb-6 relative">
          {/* Avatar overlapping band */}
          <div className="flex items-end gap-4 -mt-12">
            <div className="relative group cursor-pointer" onClick={() => setEditOpen(true)}>
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-[30px] font-extrabold text-white shrink-0"
                style={{
                  backgroundColor: ROLE_COLOR,
                  border: "3px solid var(--surface)",
                  boxShadow: "0 0 0 2px var(--surface), 0 0 0 4.5px #F59E0B, 0 0 12px rgba(245,158,11,0.45), 0 0 24px rgba(245,158,11,0.15)",
                }}>AK</div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Settings className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[24px] font-extrabold" style={{ color: "var(--text-1)" }}>Arjun Kumar</h1>
                <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center" style={{ background: "#F59E0B" }}>
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: `${ROLE_COLOR}1A`, color: ROLE_COLOR, border: `1px solid ${ROLE_COLOR}33` }}>{ROLE_LABEL}</span>
              </div>
              <p className="text-[12px] font-mono" style={{ color: "var(--text-3)" }}>@arjunkumar</p>
            </div>
          </div>

          {/* Status pill */}
          <div className="flex items-center gap-1.5 mt-2 ml-0">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--open-green)", animation: "statusPulse 2s infinite" }} />
            <span className="text-[12px] font-medium" style={{ color: "var(--open-green)" }}>Open to work</span>
          </div>

          {/* Headline */}
          <p className="text-[14px] mt-2 line-clamp-1" style={{ color: "var(--text-2)", lineHeight: 1.75 }}>Final year CSE student building at the intersection of health and technology.</p>

          {/* Chips row */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Link to="/app/institution/1" className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full transition-all duration-150" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
              <Building2 className="w-3 h-3" /> DTU
            </Link>
            <span className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
              <MapPin className="w-3 h-3" /> Delhi, India
            </span>
            <span className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
              <Languages className="w-3 h-3" /> Hindi, English
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <Button variant="ghost" size="sm" className="gap-1.5 rounded-full" onClick={handleCopyLink}><Copy className="w-3.5 h-3.5" /> Copy link</Button>
            <Button variant="secondary" size="sm" className="gap-1.5 rounded-full" onClick={() => setEditOpen(true)}><Settings className="w-3.5 h-3.5" /> Edit profile</Button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <button onClick={() => setActiveTab("Work")} className="text-center cursor-pointer">
              <p className="text-[22px] font-extrabold" style={{ color: "var(--text-1)" }}>3</p>
              <p className="micro-label mt-0.5">Projects</p>
            </button>
            <button onClick={() => setActiveTab("About")} className="text-center cursor-pointer">
              <p className="text-[22px] font-extrabold" style={{ color: "var(--text-1)" }}>2</p>
              <p className="micro-label mt-0.5">Workspaces</p>
            </button>
            <Link to="/app/strands" className="text-center">
              <p className="text-[22px] font-extrabold" style={{ color: "var(--text-1)" }}>156</p>
              <p className="micro-label mt-0.5">Strands</p>
            </Link>
            <div className="ml-auto">
              <ActivityScoreRing score={78} size={44} strokeWidth={4} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="t-card mt-0 overflow-hidden" style={{ borderRadius: 0 }}>
        <div className="flex overflow-x-auto scrollbar-hide px-6" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="py-3.5 px-4 text-[13px] font-semibold relative whitespace-nowrap transition-all duration-200 cursor-pointer"
              style={{ color: activeTab === tab ? "var(--brand)" : "var(--text-2)", fontWeight: activeTab === tab ? 700 : 600, borderBottom: activeTab === tab ? "3px solid var(--brand)" : "3px solid transparent" }}>
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ═══ WORK TAB — VERTICAL TIMELINE ═══ */}
          {activeTab === "Work" && (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-5 bottom-16 w-[2px]" style={{ background: "var(--border-2)" }} />

              <div className="space-y-3.5">
                {mockProjects.map((p) => {
                  const sc = statusColors[p.status] || statusColors.active;
                  return (
                    <div key={p.title} className="flex gap-4 relative">
                      {/* Timeline dot */}
                      <div className="w-6 flex justify-center pt-5 shrink-0 z-10">
                        <div className="w-[10px] h-[10px] rounded-full" style={{ background: sc.dot, border: "2px solid var(--surface)" }} />
                      </div>

                      {/* Card */}
                      <div className="flex-1 t-card t-card-hover overflow-hidden cursor-pointer" style={{ borderLeft: `4px solid ${sc.accent}` }}>
                        {/* Header */}
                        <div className="flex items-start gap-3 px-4 pt-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--brand-dim)" }}>
                            <Layers className="w-5 h-5" style={{ color: "var(--brand)" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-[15px] font-bold" style={{ color: "var(--text-1)" }}>{p.title}</h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                                background: sc.dot === "var(--open-green)" ? "rgba(16,185,129,0.1)" : "var(--brand-dim)",
                                color: sc.dot === "var(--open-green)" ? "var(--open-green)" : "var(--brand)",
                              }}>{sc.label}</span>
                            </div>
                            {p.tiikApproved && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", boxShadow: "0 0 8px rgba(245,158,11,0.2)" }}>
                                <CheckCircle className="w-3 h-3" /> Tiik Approved
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-1.5 px-4 mt-1 text-[12px] flex-wrap" style={{ color: "var(--text-3)" }}>
                          <span>Your role: {p.role}</span>
                          <span>·</span>
                          <span>Team of {p.teamSize}</span>
                          <span>·</span>
                          <Link to="/app/institution/1" className="font-semibold" style={{ color: "var(--brand)" }}>{p.company}</Link>
                        </div>

                        {/* Description */}
                        <p className="text-[13px] px-4 mt-2 line-clamp-2" style={{ color: "var(--text-2)" }}>{p.description}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 px-4 mt-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>{p.domain}</span>
                          {p.tech.map(t => (
                            <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{t}</span>
                          ))}
                        </div>

                        {/* Team chain */}
                        <div className="flex items-center gap-1 px-4 mt-2">
                          {Array.from({ length: Math.min(3, p.teamSize) }).map((_, i) => (
                            <Link key={i} to="/app/profile" className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white -ml-2 first:ml-0 hover:scale-110 transition-transform" style={{ backgroundColor: ["#4F46E5", "#0369A1", "#C2410C", "#92400E"][i], border: "2px solid var(--surface)" }}>
                              {["AK", "RS", "PM", "RK"][i]}
                            </Link>
                          ))}
                          {p.teamSize > 3 && <span className="text-[11px] ml-1" style={{ color: "var(--text-3)" }}>+{p.teamSize - 3} more</span>}
                        </div>

                        {/* Awaiting approval banner */}
                        {!p.tiikApproved && p.anchor && p.anchorStatus === "pending" && (
                          <div className="mx-4 mt-2 rounded-lg px-3 py-2" style={{ background: "rgba(245,158,11,0.06)", border: "1px dashed rgba(245,158,11,0.35)" }}>
                            <p className="text-[12px] font-medium" style={{ color: "rgba(245,158,11,0.85)" }}>⏳ Awaiting Tiik Approval from {p.anchor}</p>
                            <button onClick={() => setVerifyProject(p)} className="text-[11px] font-semibold mt-0.5 cursor-pointer" style={{ color: "var(--brand)" }}>Resend invite →</button>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-3 mt-2" style={{ borderTop: "1px solid var(--border)" }}>
                          <div className="flex items-center gap-3 text-[12px]" style={{ color: "var(--text-3)" }}>
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {p.views} views</span>
                            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {p.recruiterViews} recruiter views</span>
                          </div>
                          {p.hubId && (
                            <Link to={`/app/teams/${p.hubId}`} className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: "var(--brand)" }}>
                              View Hub <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add work card */}
              <div className="flex gap-4 relative mt-3">
                <div className="w-6 shrink-0" />
                <button className="flex-1 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200" style={{ border: "2px dashed var(--border-2)" }}>
                  <Plus className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-3)" }} />
                  <p className="text-[13px]" style={{ color: "var(--text-2)" }}>Add work, project, or achievement</p>
                </button>
              </div>
            </div>
          )}

          {/* ═══ POSTS TAB ═══ */}
          {activeTab === "Posts" && (
            <EmptyState icon={MessageCircle} title="No posts yet" description="Share your first update — a project milestone, an insight, or a question." actionLabel="Share your first update" onAction={() => toast.info("Opening compose...")} />
          )}

          {/* ═══ ABOUT TAB ═══ */}
          {activeTab === "About" && (
            <div className="space-y-8">
              {/* Education */}
              <div>
                <p className="micro-label mb-3">EDUCATION & EXPERIENCE</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--brand-dim)" }}><Building2 className="w-5 h-5" style={{ color: "var(--brand)" }} /></div>
                    <div>
                      <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Delhi Technological University</p>
                      <p className="text-[12px]" style={{ color: "var(--text-3)" }}>B.Tech Computer Science · 2022 – 2026</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workspaces */}
              <div>
                <p className="micro-label mb-3">MY WORKSPACES</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[{ name: "TelemedicineRx Team", members: 4, projects: 2, role: "Lead" }, { name: "DTU CS Club", members: 28, projects: 5, role: "Member" }].map(w => (
                    <Link key={w.name} to="/app/teams" className="t-card t-card-hover p-4 block" style={{ borderLeft: "4px solid var(--brand)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[14px] font-bold" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{w.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{w.name}</p>
                          <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{w.members} members · {w.projects} projects</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{w.role}</span>
                        </div>
                      </div>
                      <p className="text-[13px] font-semibold mt-2" style={{ color: "var(--brand)" }}>View workspace →</p>
                    </Link>
                  ))}
                  <button className="rounded-2xl p-6 text-center cursor-pointer transition-all duration-200" style={{ border: "2px dashed var(--border-2)" }}>
                    <Plus className="w-6 h-6 mx-auto mb-1" style={{ color: "var(--text-3)" }} />
                    <p className="text-[13px]" style={{ color: "var(--text-2)" }}>Create or join workspace</p>
                  </button>
                </div>
              </div>

              {/* Skills */}
              <div>
                <p className="micro-label mb-3">SKILLS</p>
                <div className="flex flex-wrap gap-2">
                  {["React", "TypeScript", "Python", "TensorFlow", "Node.js", "PostgreSQL", "React Native", "Supabase"].map(s => (
                    <span key={s} className="text-[12px] font-semibold px-3 py-1.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ VERIFICATIONS TAB ═══ */}
          {activeTab === "Verifications" && (
            <div className="space-y-1">
              {[{ level: "Phone", status: "Verified", color: "#10B981" }, { level: "Email", status: "Verified", color: "#10B981" }, { level: "Institution", status: "DTU — Verified", color: "#F59E0B" }, { level: "Tiik Approval", status: "Approved by Prof. Kumar", color: "#F59E0B" }].map(v => (
                <div key={v.level} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4" style={{ color: v.color }} />
                    <span className="text-[14px]" style={{ color: "var(--text-1)" }}>{v.level}</span>
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
