import { useState, useEffect } from "react";
import { MapPin, Copy, Shield, Layers, Users, X, Settings, MessageCircle, CheckCircle, Calendar, Globe, Send, Share2, ArrowRight, Building2, Languages, ExternalLink, Clock, Eye, Briefcase, Plus, Link2 } from "lucide-react";
import ActivityScoreRing from "@/components/ActivityScoreRing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/EmptyState";
import VisibilityToggle from "@/components/profile/VisibilityToggle";
import AchievementsTab from "@/components/profile/AchievementsTab";
import CustomLinks from "@/components/profile/CustomLinks";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const tabs = ["Work & Projects", "Achievements", "Posts", "About"] as const;
const ROLE_COLOR = "#4F46E5";
const ROLE_LABEL = "Student";

const mockProjects = [
  { title: "TelemedicineRx", company: "Delhi Tech University", location: "Delhi, India", description: "Telemedicine platform for rural India with AI triage and offline-first sync", domain: "HealthTech", status: "active" as const, role: "Lead Developer", startDate: "Jan 2025", endDate: "Present", tech: ["React Native", "Supabase", "Python", "TensorFlow"], tiikApproved: true, anchor: "Prof. Sharma", anchorStatus: "verified" as const, teamSize: 4, hubId: "telemedicinerx", views: 847, recruiterViews: 6, visibility: "public" },
  { title: "SmartGrid Monitor", company: "IIT Delhi Research Lab", location: "Delhi, India", description: "IoT dashboard for electrical grid monitoring across 4 states with real-time anomaly detection", domain: "IoT", status: "completed" as const, role: "Frontend Engineer", startDate: "Aug 2024", endDate: "Dec 2024", tech: ["React", "Node.js", "MQTT", "D3.js"], tiikApproved: false, anchor: "Dr. Verma", anchorStatus: "pending" as const, teamSize: 3, hubId: "smartgrid", views: 312, recruiterViews: 2, visibility: "public" },
  { title: "EduBridge App", company: "Self / Open Source", location: "Remote", description: "Vernacular learning platform for government school students in rural districts", domain: "EdTech", status: "completed" as const, role: "Full Stack Developer", startDate: "Mar 2024", endDate: "Jul 2024", tech: ["Next.js", "PostgreSQL"], tiikApproved: true, anchor: null, anchorStatus: "none" as const, teamSize: 1, hubId: null, views: 189, recruiterViews: 1, visibility: "connections" },
];

const mockCustomLinks = [
  { url: "https://github.com/arjunkumar", label: "My GitHub" },
  { url: "https://arjunkumar.dev", label: "Portfolio" },
];

const statusColors: Record<string, { dot: string; accent: string; label: string }> = {
  active: { dot: "var(--brand)", accent: "var(--open-green)", label: "Active" },
  completed: { dot: "var(--open-green)", accent: "var(--brand)", label: "Completed" },
  paused: { dot: "#F59E0B", accent: "#F59E0B", label: "Paused" },
};

const EditProfileDrawer = ({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) => {
  const [form, setForm] = useState({ name: "", headline: "", bio: "", city: "", state: "", username: "" });
  const [saving, setSaving] = useState(false);
  const [customLinks, setCustomLinks] = useState(mockCustomLinks);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setForm({
          name: data.full_name || "",
          headline: data.headline || "",
          bio: data.bio || "",
          city: data.location_city || "",
          state: data.location_state || "",
          username: data.username || "",
        });
      }
    };
    load();
  }, [open]);

  const addLink = () => { if (customLinks.length < 5) setCustomLinks([...customLinks, { url: "", label: "" }]); };
  const updateLink = (i: number, key: string, val: string) => {
    const updated = [...customLinks];
    updated[i] = { ...updated[i], [key]: val };
    setCustomLinks(updated);
  };
  const removeLink = (i: number) => setCustomLinks(customLinks.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.name,
      headline: form.headline.slice(0, 80),
      bio: form.bio.slice(0, 300),
      username: form.username,
      location_city: form.city,
      location_state: form.state,
      custom_links: customLinks.filter(l => l.url) as any,
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Profile updated ✓");
    onSaved();
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
        className="w-full sm:w-[400px] h-full sm:h-auto sm:max-h-[90vh] rounded-l-[24px] sm:rounded-[20px] p-6 sm:p-8 overflow-y-auto glass-card"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)" }}>Edit profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg cursor-pointer active:scale-95" style={{ color: "var(--text-3)" }}><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div><label className="micro-label block mb-1.5">Display name</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="micro-label block mb-1.5">Headline (80 chars)</label><Input value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value.slice(0, 80) })} maxLength={80} /></div>
          <div>
            <label className="micro-label block mb-1.5">Bio (300 chars)</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value.slice(0, 300) })} placeholder="Tell people about yourself..." rows={3} maxLength={300}
              className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none transition-all duration-150"
              style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[13px]" style={{ color: "var(--text-3)" }}>@</span>
            <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="flex-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="micro-label block mb-1.5">City</label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="micro-label block mb-1.5">State</label><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
          </div>

          <div>
            <label className="micro-label block mb-1.5">Custom Links</label>
            <div className="space-y-2">
              {customLinks.map((link, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input placeholder="URL" value={link.url} onChange={e => updateLink(i, "url", e.target.value)} className="flex-1" />
                  <Input placeholder="Display text" value={link.label} onChange={e => updateLink(i, "label", e.target.value)} className="flex-1" />
                  <button onClick={() => removeLink(i)} className="p-1 cursor-pointer" style={{ color: "var(--text-3)" }}><X className="w-4 h-4" /></button>
                </div>
              ))}
              {customLinks.length < 5 && (
                <button onClick={addLink} className="text-[12px] font-semibold cursor-pointer" style={{ color: "var(--brand)" }}>+ Add another link</button>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
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
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Work & Projects");
  const [editOpen, setEditOpen] = useState(false);
  const [verifyProject, setVerifyProject] = useState<typeof mockProjects[0] | null>(null);
  const [projectVisibility, setProjectVisibility] = useState<Record<string, string>>(
    Object.fromEntries(mockProjects.map(p => [p.title, p.visibility]))
  );
  const { profile: authProfile, initials: authInitials, displayName: authDisplayName, refreshProfile } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: profile }, { data: ws }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("workspace_members").select("*, workspace:workspaces(name, type)").eq("user_id", user.id),
    ]);
    setProfileData(profile);
    setWorkspaces(ws || []);
  };

  useEffect(() => { loadProfile(); }, []);

  const displayName = profileData?.full_name || authDisplayName || "Your Name";
  const username = profileData?.username || authProfile?.username || "username";
  const headline = profileData?.headline || "";
  const institution = profileData?.institution_name || "";
  const city = profileData?.location_city || "";
  const state = profileData?.location_state || "";
  const role = profileData?.role || authProfile?.role || "student";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " ");
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "U";
  const ROLE_COLOR_MAP: Record<string, string> = { student: "#4F46E5", professional: "#0369A1", doctor: "#0E7490", government: "#166534", skilled_trade: "#C2410C", hr: "#6B21A8", faculty: "#92400E", builder: "#7C3AED", aspirant: "#374151" };
  const roleColor = ROLE_COLOR_MAP[role] || "#4F46E5";

  const handleCopyLink = async () => {
    const url = window.location.origin + "/" + username;
    await navigator.clipboard.writeText(url);
    toast.success(`Profile link copied! tiikme.in/${username}`);
  };

  return (
    <div className="max-w-[760px] mx-auto px-0 md:px-4 py-0 md:py-7 space-y-0">
      {/* ═══ PROFILE HERO CARD ═══ */}
      <div className="t-card overflow-hidden relative" style={{ borderRadius: "0px", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
        <div className="h-[100px] md:h-[100px] relative" style={{
211:           background: `linear-gradient(135deg, color-mix(in srgb, ${roleColor} 40%, var(--surface)) 0%, color-mix(in srgb, ${roleColor} 15%, var(--surface)) 50%, var(--surface) 100%)`,
        }}>
          <div className="absolute right-8 top-4 w-10 h-10 rounded-full" style={{ background: ROLE_COLOR, opacity: 0.08, filter: "blur(12px)" }} />
          <div className="absolute right-20 top-8 w-8 h-8 rounded-full" style={{ background: ROLE_COLOR, opacity: 0.06, filter: "blur(10px)" }} />
          <div className="absolute right-32 top-3 w-6 h-6 rounded-full" style={{ background: ROLE_COLOR, opacity: 0.05, filter: "blur(8px)" }} />
          <div className="absolute top-3 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B" }}>
            <Shield className="w-3 h-3" /> Tiik Approved by DTU
          </div>
        </div>

        <div className="px-6 pb-6 relative">
          <div className="flex items-end gap-4 -mt-12">
            <div className="relative group cursor-pointer" onClick={() => setEditOpen(true)}>
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-[30px] font-extrabold text-white shrink-0 overflow-hidden"
                style={{
                  backgroundColor: ROLE_COLOR,
                  border: "3px solid var(--surface)",
                  boxShadow: "0 0 0 2px var(--surface), 0 0 0 4.5px #F59E0B, 0 0 12px rgba(245,158,11,0.45), 0 0 24px rgba(245,158,11,0.15)",
                }}>
                {profileData?.avatar_url ? <img src={profileData.avatar_url} alt="" className="w-full h-full object-cover" /> : displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Settings className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[24px] font-extrabold" style={{ color: "var(--text-1)" }}>{displayName}</h1>
                <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center" style={{ background: "#F59E0B" }}>
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: `${ROLE_COLOR}1A`, color: ROLE_COLOR, border: `1px solid ${ROLE_COLOR}33` }}>{ROLE_LABEL}</span>
              </div>
              <p className="text-[12px] font-mono" style={{ color: "var(--text-3)" }}>@{username}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2 ml-0">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--open-green)", animation: "statusPulse 2s infinite" }} />
            <span className="text-[12px] font-medium" style={{ color: "var(--open-green)" }}>Open to work</span>
          </div>

          <p className="text-[14px] mt-2 line-clamp-1" style={{ color: "var(--text-2)", lineHeight: 1.75 }}>{headline}</p>

          <div className="flex flex-wrap gap-1.5 mt-3">
            <Link to="/app/institution/1" className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full transition-all duration-150" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
              <Building2 className="w-3 h-3" /> {institution}
            </Link>
            <span className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
              <MapPin className="w-3 h-3" /> {city}, {state}
            </span>
            <span className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
              <Languages className="w-3 h-3" /> Hindi, English
            </span>
          </div>

          <div className="mt-2">
            <CustomLinks links={mockCustomLinks} />
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="ghost" size="sm" className="gap-1.5 rounded-full" onClick={handleCopyLink}><Copy className="w-3.5 h-3.5" /> Copy link</Button>
            <Button variant="secondary" size="sm" className="gap-1.5 rounded-full" onClick={() => setEditOpen(true)}><Settings className="w-3.5 h-3.5" /> Edit profile</Button>
          </div>

          <div className="flex items-center gap-6 mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <button onClick={() => setActiveTab("Work & Projects")} className="text-center cursor-pointer">
              <p className="text-[22px] font-extrabold" style={{ color: "var(--text-1)" }}>3</p>
              <p className="micro-label mt-0.5">Projects</p>
            </button>
            <button onClick={() => setActiveTab("About")} className="text-center cursor-pointer">
              <p className="text-[22px] font-extrabold" style={{ color: "var(--text-1)" }}>{workspaces.length || 2}</p>
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
          {activeTab === "Work & Projects" && (
            <div className="relative">
              <div className="absolute left-[11px] top-5 bottom-16 w-[2px]" style={{ background: "var(--border-2)" }} />
              <div className="space-y-3.5">
                {mockProjects.map((p) => {
                  const sc = statusColors[p.status] || statusColors.active;
                  const vis = projectVisibility[p.title] || "public";
                  return (
                    <div key={p.title} className="flex gap-4 relative">
                      <div className="w-6 flex justify-center pt-5 shrink-0 z-10">
                        <div className="w-[10px] h-[10px] rounded-full" style={{ background: sc.dot, border: "2px solid var(--surface)" }} />
                      </div>
                      <div className="flex-1 t-card t-card-hover overflow-hidden cursor-pointer" style={{ borderLeft: `4px solid ${sc.accent}` }}>
                        <div className="flex items-start gap-3 px-4 pt-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--brand-dim)" }}>
                            <Layers className="w-5 h-5" style={{ color: "var(--brand)" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link to={p.hubId ? `/app/teams/${p.hubId}` : "#"} className="text-[14px] font-bold hover:underline" style={{ color: "var(--text-1)" }}>{p.title}</Link>
                              {p.tiikApproved && (
                                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
                                  <Shield className="w-2.5 h-2.5" /> Tiik Approved
                                </span>
                              )}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `rgba(${sc.dot === "var(--brand)" ? "61,90,241" : sc.dot === "var(--open-green)" ? "16,185,129" : "245,158,11"},0.12)`, color: sc.dot.startsWith("var") ? sc.dot : sc.dot }}>{sc.label}</span>
                            </div>
                            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-3)" }}>{p.company} · {p.role}</p>
                          </div>
                        </div>
                        <p className="px-4 pt-1.5 text-[13px] line-clamp-2" style={{ color: "var(--text-2)" }}>{p.description}</p>
                        <div className="flex flex-wrap gap-1 px-4 pt-2">
                          {p.tech.slice(0, 4).map(t => <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)" }}>{t}</span>)}
                          {p.tech.length > 4 && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full cursor-pointer" style={{ background: "var(--surface-2)", color: "var(--brand)", border: "1px solid var(--border)" }}>+{p.tech.length - 4} more</span>}
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3 mt-2" style={{ borderTop: "1px solid var(--border)" }}>
                          <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-3)" }}><Eye className="w-3 h-3" /> {p.views}</span>
                          <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-3)" }}><Briefcase className="w-3 h-3" /> {p.recruiterViews} recruiter views</span>
                          <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-3)" }}><Users className="w-3 h-3" /> {p.teamSize}</span>
                          <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-3)" }}><Calendar className="w-3 h-3" /> {p.startDate} – {p.endDate}</span>
                          <div className="ml-auto"><VisibilityToggle value={vis} onChange={v => setProjectVisibility(prev => ({ ...prev, [p.title]: v }))} /></div>
                        </div>
                        {!p.tiikApproved && p.anchor && (
                          <button onClick={() => setVerifyProject(p)} className="w-full px-4 py-2.5 text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                            style={{ background: "rgba(245,158,11,0.06)", color: "#F59E0B", borderTop: "1px solid rgba(245,158,11,0.15)" }}>
                            <Shield className="w-3.5 h-3.5" /> Get Tiik Approved — Invite {p.anchor}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link to="/app/mywork" className="flex items-center justify-center gap-1.5 mt-5 py-3 t-card t-card-hover text-[13px] font-semibold" style={{ color: "var(--brand)" }}>
                <Plus className="w-4 h-4" /> Add new project
              </Link>
            </div>
          )}

          {activeTab === "Achievements" && <AchievementsTab isOwnProfile={true} />}

          {activeTab === "Posts" && (
            <EmptyState icon={MessageCircle} title="No posts yet" description="Posts you share on the feed will appear here." />
          )}

          {activeTab === "About" && (
            <div className="space-y-6">
              <div>
                <p className="micro-label mb-3">EDUCATION</p>
                <div className="t-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--brand-dim)" }}>
                    <Building2 className="w-5 h-5" style={{ color: "var(--brand)" }} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{institution}</p>
                    <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{profileData?.role || ROLE_LABEL}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="micro-label mb-3">WORKSPACES</p>
                {workspaces.length > 0 ? (
                  <div className="space-y-2">
                    {workspaces.map((ws: any) => (
                      <div key={ws.id} className="t-card p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>
                          {ws.workspace?.name?.slice(0, 2).toUpperCase() || "WS"}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{ws.workspace?.name || "Workspace"}</p>
                          <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{ws.role} · {ws.workspace?.type || "Project"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {["TelemedicineRx Team", "DTU CS Club"].map(n => (
                      <div key={n} className="t-card p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>{n.slice(0, 2).toUpperCase()}</div>
                        <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>{n}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="micro-label mb-3">SKILLS</p>
                <div className="flex flex-wrap gap-1.5">
                  {["React", "TypeScript", "Python", "Supabase", "IoT", "ML", "Node.js", "Docker"].map(s => (
                    <span key={s} className="text-[11px] font-medium px-3 py-1 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editOpen && <EditProfileDrawer open={editOpen} onClose={() => setEditOpen(false)} onSaved={loadProfile} />}
        {verifyProject && <VerificationModal project={verifyProject} onClose={() => setVerifyProject(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
