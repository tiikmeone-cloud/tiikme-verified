import { useState } from "react";
import { MapPin, Copy, Pencil, Download, Shield, ExternalLink, Layers, Share2, Users, MoreHorizontal, X, Camera, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const tabs = ["Posts", "Work", "About", "Verifications"] as const;
const ROLE_COLOR = "#4F46E5";

const mockProjects = [
  { title: "TelemedicineRx", description: "Telemedicine platform for rural India with AI triage", domain: "HealthTech", status: "active" as const, tech: ["React Native", "Supabase", "Python"], tiikApproved: true },
  { title: "SmartGrid Monitor", description: "IoT dashboard for electrical grid monitoring", domain: "IoT", status: "completed" as const, tech: ["React", "Node.js", "MQTT"], tiikApproved: false },
];

const mockGroups = [
  { name: "CodeCraft Club", initials: "CC", color: "#0369A1", members: 12, activeProjects: 3 },
  { name: "EduTech Builders", initials: "EB", color: "#92400E", members: 28, activeProjects: 5 },
];

const EditProfileModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form, setForm] = useState({ name: "Arjun Kumar", headline: "Final year CSE student building at the intersection of health and technology.", bio: "", city: "Delhi", state: "Delhi", status: "open", portfolio: "" });
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(4,6,26,0.7)", backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div className="rounded-[20px] p-6 sm:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)" }}>Edit profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg"><X className="w-5 h-5" style={{ color: "var(--text-3)" }} /></button>
        </div>
        <div className="space-y-4">
          {[{ label: "Display name", val: form.name, key: "name" }, { label: "Headline", val: form.headline, key: "headline" }].map(f => (
            <div key={f.key}>
              <label className="micro-label block mb-1">{f.label}</label>
              <Input value={f.val} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="h-11" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
            </div>
          ))}
          <div>
            <label className="micro-label block mb-1">Bio</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell people about yourself..." rows={3} className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="micro-label block mb-1">City</label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="h-11" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} /></div>
            <div><label className="micro-label block mb-1">State</label><Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="h-11" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} /></div>
          </div>
          <div className="flex justify-end pt-2"><Button onClick={() => { toast.success("Profile updated"); onClose(); }}>Save changes</Button></div>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Work");
  const [editOpen, setEditOpen] = useState(false);

  const handleCopyLink = () => { navigator.clipboard.writeText("https://tiikme.in/arjunkumar"); toast.success("Link copied!"); };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Hero Card */}
      <div className="t-card overflow-hidden" style={{ borderTop: `5px solid ${ROLE_COLOR}` }}>
        <div className="p-7">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-[28px] font-bold text-white" style={{ backgroundColor: ROLE_COLOR, boxShadow: "0 0 0 3px var(--surface), 0 0 0 5px #F59E0B, 0 0 16px rgba(245,158,11,0.4)" }}>AK</div>
              <button onClick={() => setEditOpen(true)} className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.5)" }}>
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[24px] font-extrabold" style={{ color: "var(--text-1)" }}>Arjun Kumar</h1>
                <Shield className="w-4 h-4" style={{ color: "#F59E0B" }} />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(79,70,229,0.12)", color: "#4F46E5", border: "1px solid rgba(79,70,229,0.35)" }}>Student</span>
              </div>
              <p className="text-[12px] font-mono mt-0.5" style={{ color: "var(--text-3)" }}>@arjunkumar</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--open-green)" }} />
                <span className="text-[12px] font-medium" style={{ color: "var(--open-green)" }}>Open to work</span>
              </div>
              <p className="text-[14px] mt-2" style={{ color: "var(--text-2)" }}>Final year CSE student building at the intersection of health and technology.</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {[{ icon: MapPin, text: "Delhi, India" }].map((c, i) => (
                  <span key={i} className="flex items-center gap-1 text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}><c.icon className="w-3 h-3" />{c.text}</span>
                ))}
                <Link to="/app/institution/1" className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>DTU</Link>
                <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-2)" }}>Hindi, English</span>
              </div>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <Button variant="secondary" size="sm" className="gap-1.5" onClick={handleCopyLink}><Copy className="w-3 h-3" /> Copy profile link</Button>
                <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}><Pencil className="w-3 h-3" /> Edit profile</Button>
                <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => toast.success("Download started")}><Download className="w-3 h-3" /> Export</Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6 pt-5 border-t" style={{ borderColor: "var(--border)" }}>
            {[{ label: "PROJECTS", value: "4" }, { label: "GROUPS", value: "2" }, { label: "STRANDS", value: "156" }, { label: "ACTIVITY", value: "78" }].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[22px] font-extrabold" style={{ color: "var(--text-1)" }}>{s.value}</p>
                <p className="micro-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="t-card overflow-hidden">
        <div className="flex border-b px-7" style={{ borderColor: "var(--border)" }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="py-3 px-4 text-[13px] font-semibold relative transition-colors" style={{ color: activeTab === tab ? "var(--brand)" : "var(--text-2)", borderBottom: activeTab === tab ? "3px solid var(--brand)" : "3px solid transparent" }}>
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "Work" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockProjects.map(p => (
                <div key={p.title} className="t-card t-card-hover p-5 relative">
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: p.status === "active" ? "var(--brand-dim)" : "rgba(16,185,129,0.12)", color: p.status === "active" ? "var(--brand)" : "#10B981", border: `1px solid ${p.status === "active" ? "var(--brand)" : "#10B981"}` }}>{p.status === "active" ? "Active" : "Completed"}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--brand-dim)" }}>
                    <Layers className="w-5 h-5" style={{ color: "var(--brand)" }} />
                  </div>
                  <h3 className="text-[15px] font-bold mb-1" style={{ color: "var(--text-1)" }}>{p.title}</h3>
                  <p className="text-[13px] mb-2 line-clamp-2" style={{ color: "var(--text-2)" }}>{p.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>{p.domain}</span>
                    {p.tech.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--surface-2)", color: "var(--text-3)" }}>{t}</span>)}
                  </div>
                  {p.tiikApproved && <div className="flex items-center gap-1 mt-2"><Shield className="w-3 h-3 text-[#F59E0B]" /><span className="text-[10px] font-bold text-[#F59E0B]">Tiik Approved</span></div>}
                </div>
              ))}
            </div>
          )}

          {activeTab === "Posts" && (
            <div className="text-center py-10">
              <MessageCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
              <p className="text-[14px] mb-3" style={{ color: "var(--text-2)" }}>No posts yet</p>
              <Button>Share your first update</Button>
            </div>
          )}

          {activeTab === "About" && (
            <div className="space-y-6">
              <div>
                <p className="micro-label mb-3">MY GROUPS</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mockGroups.map(g => (
                    <div key={g.name} className="t-card t-card-hover p-4 flex items-center gap-3 cursor-pointer">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center text-[14px] font-bold text-white" style={{ backgroundColor: g.color }}>{g.initials}</div>
                      <div>
                        <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{g.name}</p>
                        <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{g.members} members · {g.activeProjects} active projects</p>
                        <span className="text-[12px] font-semibold" style={{ color: "var(--brand)" }}>View group →</span>
                      </div>
                    </div>
                  ))}
                  <div className="rounded-[18px] p-4 flex items-center justify-center cursor-pointer transition-colors" style={{ border: "2px dashed var(--border-2)" }}>
                    <span className="text-[13px] font-semibold" style={{ color: "var(--text-3)" }}>+ Create or join a group</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Verifications" && (
            <div className="space-y-3">
              {[{ level: "Phone", status: "Verified", color: "#10B981" }, { level: "Email", status: "Verified", color: "#10B981" }, { level: "Institution", status: "DTU — Verified", color: "#F59E0B" }, { level: "Tiik Approval", status: "Approved by Prof. Kumar", color: "#F59E0B" }].map(v => (
                <div key={v.level} className="flex items-center justify-between py-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <span className="text-[14px]" style={{ color: "var(--text-1)" }}>{v.level}</span>
                  <span className="text-[12px] font-bold" style={{ color: v.color }}>{v.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
};

export default Profile;
