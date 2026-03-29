import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Copy, Pencil, Download, Shield, ExternalLink,
  Layers, Share2, Users, BarChart3, MoreHorizontal, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const tabs = ["Posts", "Projects", "About", "Verifications"] as const;

const mockProjects = [
  {
    title: "TelemedicineRx",
    description: "Telemedicine platform for rural India with AI triage",
    domain: "HealthTech",
    status: "active" as const,
    tech: ["React Native", "Supabase", "Python"],
  },
  {
    title: "SmartGrid Monitor",
    description: "IoT dashboard for electrical grid monitoring",
    domain: "IoT",
    status: "completed" as const,
    tech: ["React", "Node.js", "MQTT"],
  },
];

const mockGroups = [
  { name: "CodeCraft Club", initials: "CC", color: "#4FC3F7", members: 12, activeProjects: 3, head: "Prof. Sharma" },
  { name: "EduTech Builders", initials: "EB", color: "#FFB547", members: 28, activeProjects: 5, head: "Kavita Rao" },
];

const ExportModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [format, setFormat] = useState("pdf");
  const [visibility, setVisibility] = useState("public");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card rounded-2xl p-8 max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-6">Export profile</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { id: "pdf", label: "PDF Resume" },
            { id: "portfolio", label: "Portfolio PDF" },
            { id: "qr", label: "QR Card" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={`glass-card rounded-xl p-4 text-center text-xs font-bold transition-all ${format === f.id ? "border-electric" : ""}`}
              style={format === f.id ? { borderColor: "#7C6FFF", boxShadow: "0 0 15px rgba(124,111,255,0.3)" } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="mb-6">
          <label className="micro-label text-muted-foreground/50 block mb-2">Visibility</label>
          <select value={visibility} onChange={e => setVisibility(e.target.value)} className="w-full h-10 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm">
            <option value="public" className="bg-background">Public — anyone with link</option>
            <option value="strands" className="bg-background">Strands only — connections only</option>
            <option value="hidden" className="bg-background">Hidden — only you</option>
          </select>
        </div>
        <div className="glass-card rounded-full px-4 py-2.5 flex items-center gap-2 mb-6">
          <span className="text-sm font-mono text-electric flex-1">tiikme.in/arjunkumar</span>
          <button onClick={() => { navigator.clipboard.writeText("https://tiikme.in/arjunkumar"); toast.success("Link copied to clipboard"); }} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.1)]">
            <Copy className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <Button variant="hero" className="w-full" onClick={() => { toast.success("Download started"); onClose(); }}>Download now</Button>
      </motion.div>
    </div>
  );
};

const EditProfileModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [form, setForm] = useState({
    name: "Arjun Kumar",
    headline: "Final year CSE student building at the intersection of health and technology.",
    bio: "",
    city: "Delhi",
    state: "Delhi",
    status: "open",
    portfolio: "",
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Edit profile</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)]"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="micro-label text-muted-foreground/50 block mb-1">Display name</label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
          </div>
          <div>
            <label className="micro-label text-muted-foreground/50 block mb-1">Headline</label>
            <Input value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
          </div>
          <div>
            <label className="micro-label text-muted-foreground/50 block mb-1">Bio</label>
            <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell people about yourself..." rows={3} className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] rounded-xl p-4 text-sm outline-none resize-none placeholder:text-muted-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="micro-label text-muted-foreground/50 block mb-1">City</label>
              <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
            </div>
            <div>
              <label className="micro-label text-muted-foreground/50 block mb-1">State</label>
              <Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
            </div>
          </div>
          <div>
            <label className="micro-label text-muted-foreground/50 block mb-1">Status</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm">
              <option value="open" className="bg-[#050510]">Open to work</option>
              <option value="employed" className="bg-[#050510]">Employed</option>
              <option value="notlooking" className="bg-[#050510]">Not looking</option>
            </select>
          </div>
          <div>
            <label className="micro-label text-muted-foreground/50 block mb-1">Portfolio / Social link</label>
            <Input value={form.portfolio} onChange={e => setForm({ ...form, portfolio: e.target.value })} placeholder="https://..." className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="default" onClick={() => { toast.success("Profile updated"); onClose(); }}>Save changes</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const GroupDetailModal = ({ group, open, onClose }: { group: typeof mockGroups[0] | null; open: boolean; onClose: () => void }) => {
  const [tab, setTab] = useState("Members");
  if (!open || !group) return null;

  const members = [
    { name: "Arjun Kumar", initials: "AK", role: "Editor", color: "#7C6FFF" },
    { name: "Riya Sharma", initials: "RS", role: "Member", color: "#7C6FFF" },
    { name: "Rahul K.", initials: "RK", role: "Member", color: "#4FC3F7" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: group.color }}>{group.initials}</div>
            <div>
              <h3 className="font-bold">{group.name}</h3>
              <p className="text-xs text-muted-foreground">{group.members} members · {group.activeProjects} active projects</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)]"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex gap-2 mb-4">
          {["Members", "Projects", "About"].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${tab === t ? "bg-electric text-white" : "glass-card text-muted-foreground"}`}>{t}</button>
          ))}
        </div>

        {tab === "Members" && (
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.name} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: m.color }}>{m.initials}</div>
                <span className="text-sm flex-1">{m.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(124,111,255,0.2)] text-electric">{m.role}</span>
              </div>
            ))}
          </div>
        )}
        {tab === "Projects" && (
          <div className="space-y-2">
            {mockProjects.map(p => (
              <div key={p.title} className="glass-card rounded-xl p-4">
                <p className="text-sm font-bold">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </div>
            ))}
          </div>
        )}
        {tab === "About" && (
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Head: {group.head}</p>
            <p>A collaborative group focused on building impactful projects across domains.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const Profile = () => {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Projects");
  const [exportOpen, setExportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [groupModal, setGroupModal] = useState<typeof mockGroups[0] | null>(null);

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://tiikme.in/arjunkumar");
    toast.success("Link copied! tiikme.in/arjunkumar", { style: { borderLeft: "3px solid #00FFB2" } });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden role-stripe-student">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-[#7C6FFF] flex items-center justify-center text-2xl font-bold text-white ring-2 ring-[rgba(124,111,255,0.3)]">AK</div>
              <button onClick={() => setEditOpen(true)} className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center hover:bg-[rgba(255,255,255,0.06)] transition-colors">
                <Pencil className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[22px] font-bold">Arjun Kumar</h1>
                <Shield className="w-4 h-4 text-neon" />
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(124,111,255,0.2)", color: "#7C6FFF" }}>Student</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />
                  <span className="text-neon font-medium">Open to work</span>
                </span>
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1">@arjunkumar</p>
              <p className="text-sm mt-2">Final year CSE student building at the intersection of health and technology.</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" /> Delhi, India</div>
                <span className="text-xs text-muted-foreground glass-card px-2 py-0.5 rounded-full">DTU</span>
                <span className="text-xs text-muted-foreground glass-card px-2 py-0.5 rounded-full">Hindi, English</span>
              </div>
            </div>
            <div className="relative">
              <button className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)]"><MoreHorizontal className="w-5 h-5 text-muted-foreground" /></button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-5 flex-wrap">
            <Button variant="default" size="sm" className="gap-1.5" onClick={handleCopyLink}><Copy className="w-3 h-3" /> Copy profile link</Button>
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}><Pencil className="w-3 h-3" /> Edit profile</Button>
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setExportOpen(true)}><Download className="w-3 h-3" /> Export</Button>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6 pt-5 border-t border-border">
            {[
              { label: "Projects", value: "4", icon: Layers },
              { label: "Groups", value: "2", icon: Users },
              { label: "Strands", value: "156", icon: Share2 },
              { label: "Score", value: "78", icon: BarChart3 },
            ].map((stat) => (
              <button key={stat.label} className="text-center hover:bg-[rgba(255,255,255,0.04)] rounded-xl py-2 transition-colors">
                <p className="text-xl font-bold">{stat.value}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <stat.icon className="w-3 h-3" /><span>{stat.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3.5 text-sm font-medium transition-colors relative ${activeTab === tab ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"}`}>
              {tab}
              {activeTab === tab && <motion.div layoutId="profile-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-electric" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === "Projects" && (
            <div className="space-y-4">
              {mockProjects.map((project) => (
                <motion.div key={project.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5" style={{ borderLeft: `3px solid ${project.status === "active" ? "#7C6FFF" : "#00FFB2"}` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{project.title}</h3>
                        {project.status === "completed" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(0,255,178,0.2)] text-neon">Verified Complete</span>}
                        {project.status === "active" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(124,111,255,0.2)] text-electric">Active</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-muted-foreground glass-card px-2 py-0.5 rounded">{project.domain}</span>
                        {project.tech.map((t) => <span key={t} className="text-[10px] text-muted-foreground/70 px-2 py-0.5 rounded bg-[rgba(255,255,255,0.06)]">{t}</span>)}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0"><ExternalLink className="w-4 h-4" /></Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "Posts" && (
            <div className="text-center py-10">
              <p className="text-muted-foreground text-sm mb-3">No posts yet</p>
              <Button variant="default" size="sm">Share your first update</Button>
            </div>
          )}

          {activeTab === "About" && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="micro-label text-muted-foreground/50 mb-1">Institution</p>
                <p>Delhi Technological University</p>
              </div>
              <div>
                <p className="micro-label text-muted-foreground/50 mb-1">Languages</p>
                <p>Hindi, English, Punjabi</p>
              </div>
              <div>
                <p className="micro-label text-muted-foreground/50 mb-1">Journey Stage</p>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[rgba(124,111,255,0.2)] text-electric font-bold">Final Year</span>
              </div>

              {/* Groups section */}
              <div className="pt-2">
                <p className="micro-label text-muted-foreground/50 mb-3">Groups</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mockGroups.map(g => (
                    <button key={g.name} onClick={() => setGroupModal(g)} className="glass-card-hover rounded-xl p-4 text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: g.color }}>{g.initials}</div>
                        <div>
                          <p className="text-sm font-bold">{g.name}</p>
                          <p className="text-[10px] text-muted-foreground">{g.members} members · {g.activeProjects} projects</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Head: {g.head}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "Verifications" && (
            <div className="space-y-3">
              {[
                { label: "Phone verified", verified: true },
                { label: "Email verified (dtu.ac.in)", verified: true },
                { label: "Institution domain", verified: true },
                { label: "Document verification", verified: false },
              ].map((v) => (
                <div key={v.label} className="flex items-center gap-3 text-sm">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${v.verified ? "bg-[rgba(0,255,178,0.2)]" : "bg-[rgba(255,255,255,0.06)]"}`}>
                    <Shield className={`w-3 h-3 ${v.verified ? "text-neon" : "text-muted-foreground"}`} />
                  </div>
                  <span className={v.verified ? "text-foreground" : "text-muted-foreground"}>{v.label}</span>
                  {v.verified && <span className="text-[10px] text-neon font-bold ml-auto">Verified</span>}
                  {!v.verified && <Button variant="ghost" size="xs" className="ml-auto text-xs">Verify now</Button>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
      <GroupDetailModal group={groupModal} open={!!groupModal} onClose={() => setGroupModal(null)} />
    </div>
  );
};

export default Profile;
