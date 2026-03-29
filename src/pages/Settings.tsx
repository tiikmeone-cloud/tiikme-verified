import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon, User, Bell, Shield, Check, GraduationCap, Briefcase, Rocket, Laptop, Coffee,
  Globe, Users, Clock, Trash2, Download, Key, Mail, Palette, Sun, Moon, Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const navItems = ["Profile", "My Journey", "Appearance", "Privacy", "Group Admin", "Alerts", "Language", "Account"];

const journeyCards = [
  { id: "higher", icon: GraduationCap, title: "Higher studies", desc: "M.Tech, MBA, PhD — stay as Student" },
  { id: "job", icon: Briefcase, title: "Got a job", desc: "Become Professional — your projects prove skills" },
  { id: "startup", icon: Rocket, title: "Starting a startup", desc: "Become Founder — turn projects into product" },
  { id: "freelance", icon: Laptop, title: "Freelancing", desc: "Become Professional — projects are your portfolio" },
  { id: "break", icon: Coffee, title: "Taking a break", desc: "Become Alumni — reactivate any time" },
];

const languages = [
  { code: "en", label: "English", native: "English" },
  { code: "te", label: "తెలుగు", native: "Telugu" },
  { code: "hi", label: "हिंदी", native: "Hindi" },
  { code: "ta", label: "தமிழ்", native: "Tamil" },
  { code: "kn", label: "ಕನ್ನಡ", native: "Kannada" },
  { code: "mr", label: "मराठी", native: "Marathi" },
];

const accentOptions = [
  { id: "electric", label: "Electric Indigo", color: "#7C6FFF" },
  { id: "neon", label: "Neon Mint", color: "#00FFB2" },
  { id: "coral", label: "Coral Rose", color: "#FF6B6B" },
  { id: "amber", label: "Amber Gold", color: "#FFB547" },
];

const Toggle = ({ label, defaultOn = true }: { label: string; defaultOn?: boolean }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm">{label}</span>
      <button
        onClick={() => { setOn(!on); toast.success("Preference saved"); }}
        className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors"
        style={{ backgroundColor: on ? "rgba(124,111,255,0.4)" : "rgba(255,255,255,0.1)" }}
      >
        <div className="w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: on ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );
};

const applyTheme = (t: string) => {
  const resolved = t === "system"
    ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : t;
  document.documentElement.setAttribute("data-theme", resolved);
};

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("Profile");
  const [journeyChoice, setJourneyChoice] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState("en");
  const [theme, setTheme] = useState(() => localStorage.getItem("tiikme-theme") || "dark");
  const [accent, setAccent] = useState("electric");
  const [textSize, setTextSize] = useState("default");
  const [profile, setProfile] = useState({
    name: "Arjun Kumar", headline: "Final year CSE student building at the intersection of health and technology.",
    bio: "", institution: "Delhi Technological University", city: "Delhi", state: "Delhi", slug: "arjunkumar",
  });

  useEffect(() => {
    applyTheme(theme);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("tiikme-theme", newTheme);
    applyTheme(newTheme);
    toast.success(`Theme set to ${newTheme}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-7 h-7 text-electric" />
        <h1 className="text-[28px] font-bold">Settings</h1>
      </div>

      <div className="flex gap-6">
        {/* Left nav */}
        <div className="hidden md:block w-[200px] shrink-0">
          <div className="space-y-1 sticky top-20">
            {navItems.map(item => (
              <button key={item} onClick={() => setActiveTab(item)}
                className="w-full text-left text-sm px-4 py-2.5 rounded-xl transition-all"
                style={{ background: activeTab === item ? "rgba(124,111,255,0.15)" : "transparent", color: activeTab === item ? "#F0F0FF" : "rgba(240,240,255,0.5)", fontWeight: activeTab === item ? 700 : 500 }}>
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="md:hidden flex gap-2 mb-4 overflow-x-auto scrollbar-hide absolute top-[120px] left-4 right-4">
          {navItems.map(item => (
            <button key={item} onClick={() => setActiveTab(item)}
              className="whitespace-nowrap text-xs font-bold px-3 py-2 rounded-full glass-card shrink-0"
              style={activeTab === item ? { background: "#7C6FFF", color: "white", borderColor: "#7C6FFF" } : { color: "rgba(240,240,255,0.5)" }}>
              {item}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          {/* PROFILE */}
          {activeTab === "Profile" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-1">Profile information</h3>
                <p className="text-sm text-muted-foreground mb-6">How you appear to students, recruiters, and professionals.</p>
                <div className="space-y-4">
                  <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Full name" className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
                  <Input value={profile.headline} onChange={e => setProfile({ ...profile, headline: e.target.value })} placeholder="Headline" className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
                  <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Bio" rows={3} className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] rounded-xl p-4 text-sm outline-none resize-none placeholder:text-muted-foreground" />
                  <Input value={profile.institution} onChange={e => setProfile({ ...profile, institution: e.target.value })} placeholder="Institution" className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} placeholder="City" className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
                    <Input value={profile.state} onChange={e => setProfile({ ...profile, state: e.target.value })} placeholder="State" className="h-12 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">tiikme.in/</span>
                    <Input value={profile.slug} onChange={e => setProfile({ ...profile, slug: e.target.value })} className="h-10 bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.12)] flex-1" />
                  </div>
                  <div className="flex justify-end">
                    <Button variant="default" onClick={() => toast.success("Profile saved")}>Save changes</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* MY JOURNEY */}
          {activeTab === "My Journey" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass-card rounded-2xl p-5" style={{ borderColor: "#7C6FFF", boxShadow: "0 0 15px rgba(124,111,255,0.2)" }}>
                <h3 className="text-lg font-bold mb-1">My journey</h3>
                <p className="text-sm text-muted-foreground">Update where you are. Your project history always stays — Tiikme travels with you.</p>
              </div>
              <div>
                <p className="text-sm font-bold mb-3">Current year</p>
                <select className="w-full h-12 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm mb-6">
                  {["1st Year", "2nd Year", "3rd Year", "4th Year", "Final Year", "Postgraduate", "Alumni"].map(y => <option key={y} className="bg-[#050510]">{y}</option>)}
                </select>
              </div>
              <p className="text-sm font-bold mb-3">What happens next?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {journeyCards.map(card => (
                  <button key={card.id} onClick={() => setJourneyChoice(card.id)} className="glass-card rounded-2xl p-5 text-left transition-all relative"
                    style={journeyChoice === card.id ? { borderColor: "#7C6FFF", boxShadow: "0 0 20px rgba(124,111,255,0.3)" } : {}}>
                    {journeyChoice === card.id && <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-electric flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                    <card.icon className="w-7 h-7 text-electric mb-3" />
                    <h4 className="text-sm font-bold mb-1">{card.title}</h4>
                    <p className="text-xs text-muted-foreground">{card.desc}</p>
                  </button>
                ))}
              </div>
              {journeyChoice && <Button variant="default" className="w-full" onClick={() => toast.success("Journey updated! Your role badge has been updated.")}>Update my journey</Button>}
              <p className="text-xs text-muted-foreground text-center">All your project history is preserved regardless of journey change.</p>
            </motion.div>
          )}

          {/* APPEARANCE */}
          {activeTab === "Appearance" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-1"><Palette className="w-5 h-5 text-electric" /><h3 className="text-lg font-bold">Appearance</h3></div>
                <p className="text-sm text-muted-foreground mb-6">Customize how Tiikme looks for you.</p>

                <p className="text-sm font-bold mb-3">Theme</p>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { id: "dark", label: "Dark", icon: Moon, desc: "Default, easy on the eyes" },
                    { id: "light", label: "Light", icon: Sun, desc: "Bright and clean" },
                    { id: "system", label: "System", icon: Monitor, desc: "Match your device" },
                  ].map(t => (
                    <button key={t.id} onClick={() => handleThemeChange(t.id)}
                      className="glass-card rounded-xl p-4 text-left transition-all"
                      style={theme === t.id ? { borderColor: "#7C6FFF", boxShadow: "0 0 15px rgba(124,111,255,0.3)" } : {}}>
                      {theme === t.id && <div className="float-right w-5 h-5 rounded-full bg-electric flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                      <t.icon className="w-6 h-6 text-electric mb-2" />
                      <span className="text-sm font-bold block">{t.label}</span>
                      <span className="text-[11px] text-muted-foreground">{t.desc}</span>
                    </button>
                  ))}
                </div>

                <p className="text-sm font-bold mb-3">Accent colour</p>
                <div className="grid grid-cols-4 gap-3 mb-8">
                  {accentOptions.map(a => (
                    <button key={a.id} onClick={() => { setAccent(a.id); toast.success(`Accent set to ${a.label}`); }}
                      className="glass-card rounded-xl p-4 text-center transition-all"
                      style={accent === a.id ? { borderColor: a.color, boxShadow: `0 0 15px ${a.color}44` } : {}}>
                      <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ backgroundColor: a.color }} />
                      <span className="text-[11px] font-bold block">{a.label}</span>
                    </button>
                  ))}
                </div>

                <p className="text-sm font-bold mb-3">Text size</p>
                <div className="grid grid-cols-2 gap-3">
                  {[{ id: "default", label: "Default" }, { id: "large", label: "Large" }].map(s => (
                    <button key={s.id} onClick={() => { setTextSize(s.id); toast.success(`Text size set to ${s.label}`); }}
                      className="glass-card rounded-xl p-4 text-center transition-all"
                      style={textSize === s.id ? { borderColor: "#7C6FFF", boxShadow: "0 0 15px rgba(124,111,255,0.3)" } : {}}>
                      <span className={`font-bold block ${s.id === "large" ? "text-lg" : "text-sm"}`}>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* PRIVACY */}
          {activeTab === "Privacy" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Privacy settings</h3>
                <Toggle label="Open to work" />
                <Toggle label="Show recruiter views" />
                <Toggle label="Public profile" />
                <Toggle label="Show group project count" />
                <Toggle label="Allow strand requests" />
                <Toggle label="Public strand count" />
              </div>
            </motion.div>
          )}

          {/* GROUP ADMIN */}
          {activeTab === "Group Admin" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-1">Manage your project teams</h3>
                <p className="text-sm text-muted-foreground mb-4">Control who can edit what.</p>
                <div className="glass-card rounded-xl p-4 mb-6">
                  <p className="micro-label text-muted-foreground/50 mb-2">Role legend</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span><span className="font-bold text-amber">Admin:</span> approve completion, edit all, hide project</span>
                    <span><span className="font-bold text-neon">Editor:</span> edit description + timeline</span>
                    <span><span className="font-bold" style={{ color: "#4FC3F7" }}>Member:</span> post updates only</span>
                    <span><span className="font-bold text-muted-foreground">Viewer:</span> read only</span>
                  </div>
                </div>
                <p className="text-sm font-bold mb-3">TelemedicineRx</p>
                <div className="space-y-2">
                  {[
                    { name: "Prof. Kumar", initials: "PK", color: "#FFB547", role: "Admin", roleColor: "#FFB547" },
                    { name: "Arjun Kumar (you)", initials: "AK", color: "#7C6FFF", role: "Editor", roleColor: "#00FFB2" },
                    { name: "Riya Sharma", initials: "RS", color: "#7C6FFF", role: "Member", roleColor: "#4FC3F7" },
                    { name: "Rahul K.", initials: "RK", color: "#4FC3F7", role: "Member", roleColor: "#4FC3F7" },
                  ].map(m => (
                    <div key={m.name} className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: m.color }}>{m.initials}</div>
                      <span className="text-sm flex-1">{m.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${m.roleColor}22`, color: m.roleColor }}>{m.role}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="default" size="sm" onClick={() => toast.info("Opening invite...")}>Invite member</Button>
                  <Button variant="secondary" size="sm" onClick={() => toast.info("Completion request sent")}>Request completion</Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ALERTS */}
          {activeTab === "Alerts" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Notification preferences</h3>
                <Toggle label="Recruiter views your project" />
                <Toggle label="Discussion replies" />
                <Toggle label="Strand requests" />
                <Toggle label="Collaboration requests" />
                <Toggle label="Professional posts" defaultOn={false} />
              </div>
            </motion.div>
          )}

          {/* LANGUAGE */}
          {activeTab === "Language" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Language preference</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {languages.map(lang => (
                    <button key={lang.code} onClick={() => { setSelectedLang(lang.code); toast.success(`Language set to ${lang.native}`); }}
                      className="glass-card rounded-xl p-4 text-center transition-all"
                      style={selectedLang === lang.code ? { borderColor: "#7C6FFF", boxShadow: "0 0 15px rgba(124,111,255,0.3)" } : {}}>
                      <span className="text-lg font-bold block">{lang.label}</span>
                      <span className="text-xs text-muted-foreground">{lang.native}</span>
                    </button>
                  ))}
                </div>
                <p className="text-sm font-bold mb-2">Region</p>
                <select className="w-full h-10 rounded-xl px-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-foreground text-sm">
                  {["Telangana", "AP", "Tamil Nadu", "Karnataka", "All India"].map(r => <option key={r} className="bg-[#050510]">{r}</option>)}
                </select>
              </div>
            </motion.div>
          )}

          {/* ACCOUNT */}
          {activeTab === "Account" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold mb-2">Account</h3>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-muted-foreground" /><div><p className="text-sm">arjun@example.com</p><p className="text-xs text-muted-foreground">Email address</p></div></div>
                  <Button variant="secondary" size="xs" onClick={() => toast.info("Opening email change...")}>Change</Button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3"><Key className="w-4 h-4 text-muted-foreground" /><div><p className="text-sm">Password</p><p className="text-xs text-muted-foreground">Last changed 3 months ago</p></div></div>
                  <Button variant="secondary" size="xs" onClick={() => toast.info("Opening password reset...")}>Reset</Button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3"><Download className="w-4 h-4 text-muted-foreground" /><div><p className="text-sm">Download my data</p><p className="text-xs text-muted-foreground">Export all your profile and project data</p></div></div>
                  <Button variant="secondary" size="xs" onClick={() => toast.success("Download started")}>Export</Button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3"><Trash2 className="w-4 h-4 text-destructive" /><div><p className="text-sm text-destructive">Delete account</p><p className="text-xs text-muted-foreground">Permanently delete your account and data</p></div></div>
                  <Button variant="destructive" size="xs" onClick={() => toast.error("This action cannot be undone")}>Delete</Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
