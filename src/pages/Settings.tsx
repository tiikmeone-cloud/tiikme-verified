import { useState, useEffect } from "react";
import { Check, GraduationCap, Briefcase, Rocket, Laptop, Coffee, Sun, Moon, Monitor, Palette, Mail, Key, Download, Trash2, LogOut, AlertTriangle, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = ["Profile", "My Journey", "Appearance", "Privacy", "Institution", "Notifications", "Language", "Account"];

const journeyCards = [
  { id: "higher", icon: GraduationCap, title: "Higher studies", desc: "M.Tech, MBA, PhD — stay as Student" },
  { id: "job", icon: Briefcase, title: "Got a job", desc: "Become Professional" },
  { id: "startup", icon: Rocket, title: "Starting a startup", desc: "Become Founder" },
  { id: "freelance", icon: Laptop, title: "Freelancing", desc: "Become Professional" },
  { id: "break", icon: Coffee, title: "Taking a break", desc: "Become Alumni" },
];

const languages = [
  { code: "en", label: "English", native: "English" },
  { code: "te", label: "తెలుగు", native: "Telugu" },
  { code: "hi", label: "हिंदी", native: "Hindi" },
  { code: "ta", label: "தமிழ்", native: "Tamil" },
  { code: "kn", label: "ಕನ್ನಡ", native: "Kannada" },
  { code: "mr", label: "मराठी", native: "Marathi" },
];

const applyTheme = (t: string) => {
  const resolved = t === "system" ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : t;
  document.documentElement.setAttribute("data-theme", resolved);
};

const Toggle = ({ label, desc, defaultOn = true }: { label: string; desc?: string; defaultOn?: boolean }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-b-0">
      <div><span className="text-[14px] text-t1">{label}</span>{desc && <p className="text-[12px] text-t3">{desc}</p>}</div>
      <button onClick={() => { setOn(!on); toast.success("Preference saved"); }}
        className="w-11 h-6 rounded-full flex items-center px-0.5 transition-all duration-200 cursor-pointer active:scale-95"
        style={{ background: on ? "var(--brand)" : "var(--border-2)" }}>
        <div className="w-5 h-5 rounded-full bg-white transition-transform duration-200" style={{ transform: on ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Profile");
  const [journeyChoice, setJourneyChoice] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState("en");
  const [theme, setTheme] = useState(() => localStorage.getItem("tiikme-theme") || "dark");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [profile, setProfile] = useState({ name: "Arjun Kumar", headline: "Final year CSE student building at the intersection of health and technology.", bio: "", institution: "Delhi Technological University", city: "Delhi", state: "Delhi", slug: "arjunkumar" });

  useEffect(() => { applyTheme(theme); }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("tiikme-theme", newTheme);
    applyTheme(newTheme);
    toast.success(`Theme set to ${newTheme}`);
  };

  const handleSignOut = () => {
    setLoggingOut(true);
    setTimeout(() => {
      const savedTheme = localStorage.getItem("tiikme-theme");
      localStorage.clear();
      if (savedTheme) localStorage.setItem("tiikme-theme", savedTheme);
      navigate("/signin");
    }, 600);
  };

  return (
    <motion.div
      animate={loggingOut ? { scale: 0.97, opacity: 0 } : { scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="max-w-5xl mx-auto px-4 py-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <SlidersHorizontal className="w-6 h-6 text-brand" />
        <h1 className="text-[20px] font-extrabold text-t1">Settings</h1>
      </div>
      <div className="flex gap-6">
        {/* Left nav */}
        <div className="hidden md:block w-[200px] shrink-0">
          <div className="space-y-0.5 sticky top-20 rounded-2xl border border-border/30 overflow-hidden" style={{ background: "var(--surface)" }}>
            {navItems.map(item => (
              <button key={item} onClick={() => setActiveTab(item)}
                className={`w-full text-left text-[13px] px-4 py-2.5 transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                  activeTab === item ? "bg-brand-dim text-brand font-bold border-l-[3px] border-brand" : "text-t2 hover:bg-surface-2 border-l-[3px] border-transparent"
                }`}>
                {item}
              </button>
            ))}
            <div className="border-t border-border/30" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={handleSignOut} className="w-full text-left text-[13px] px-4 py-2.5 flex items-center gap-2 transition-all duration-200 cursor-pointer active:scale-95" style={{ color: "#DC2626" }}>
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </TooltipTrigger>
              <TooltipContent>Sign out of your account</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === "Profile" && (
            <div className="rounded-2xl border border-border/30 p-6" style={{ background: "var(--surface)" }}>
              <h3 className="text-[16px] font-bold text-t1 mb-1">Profile information</h3>
              <p className="text-[13px] text-t2 mb-6">How you appear to others.</p>
              <div className="space-y-4">
                <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Full name" className="h-11 bg-surface-2 border-border/30" />
                <Input value={profile.headline} onChange={e => setProfile({ ...profile, headline: e.target.value })} placeholder="Headline" className="h-11 bg-surface-2 border-border/30" />
                <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Bio" rows={3} className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none bg-surface-2 border border-border/30 text-t1 placeholder:text-t3" />
                <div className="grid grid-cols-2 gap-4">
                  <Input value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} className="h-11 bg-surface-2 border-border/30" />
                  <Input value={profile.state} onChange={e => setProfile({ ...profile, state: e.target.value })} className="h-11 bg-surface-2 border-border/30" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-t3">tiikme.in/</span>
                  <Input value={profile.slug} onChange={e => setProfile({ ...profile, slug: e.target.value })} className="h-11 flex-1 bg-surface-2 border-border/30" />
                </div>
                <div className="flex justify-end"><Button className="active:scale-95 transition-all duration-200" onClick={() => toast.success("Profile saved")}>Save changes</Button></div>
              </div>
            </div>
          )}

          {activeTab === "My Journey" && (
            <div className="space-y-6">
              <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "2px solid var(--brand)", borderStyle: "dashed" }}>
                <h3 className="text-[18px] font-extrabold text-t1 mb-1">Your chapter is changing. What's next?</h3>
                <p className="text-[13px] text-t2">Your project history always stays. Your role and badge updates instantly.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {journeyCards.map(c => (
                  <button key={c.id} onClick={() => setJourneyChoice(c.id)}
                    className="rounded-xl p-5 text-left transition-all duration-200 relative cursor-pointer active:scale-[0.98] border border-border/30 group"
                    style={{ background: journeyChoice === c.id ? "var(--brand-dim)" : "var(--surface)", borderColor: journeyChoice === c.id ? "var(--brand)" : undefined }}>
                    {journeyChoice === c.id && <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}><Check className="w-3 h-3 text-white" /></div>}
                    <c.icon className="w-7 h-7 mb-3 text-brand group-hover:scale-110 transition-transform duration-200" />
                    <h4 className="text-[14px] font-bold text-t1 mb-1">{c.title}</h4>
                    <p className="text-[12px] text-t2">{c.desc}</p>
                  </button>
                ))}
              </div>
              {journeyChoice && <Button className="w-full active:scale-95 transition-all duration-200" onClick={() => toast.success("Journey updated!")}>Update my journey</Button>}
            </div>
          )}

          {activeTab === "Appearance" && (
            <div className="rounded-2xl border border-border/30 p-6" style={{ background: "var(--surface)" }}>
              <div className="flex items-center gap-2 mb-1"><Palette className="w-5 h-5 text-brand" /><h3 className="text-[16px] font-bold text-t1">Appearance</h3></div>
              <p className="text-[13px] text-t2 mb-6">Customize how Tiikme looks.</p>
              <p className="text-[13px] font-bold text-t1 mb-3">Theme</p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { id: "dark", label: "Dark", icon: Moon, desc: "Krishna Blue", previewBg: "#04061A", previewSurface: "#080B2A", previewDot: "#3D5AF1" },
                  { id: "light", label: "Light", icon: Sun, desc: "Anjaneyam Orange", previewBg: "#FFF8F2", previewSurface: "#FFFFFF", previewDot: "#E8580A" },
                  { id: "system", label: "System", icon: Monitor, desc: "Match device" },
                ].map(t => (
                  <button key={t.id} onClick={() => handleThemeChange(t.id)}
                    className="rounded-xl p-4 text-left transition-all duration-200 relative overflow-hidden cursor-pointer active:scale-[0.98] border border-border/30"
                    style={{ background: theme === t.id ? "var(--brand-dim)" : "var(--surface-2)", borderColor: theme === t.id ? "var(--brand)" : undefined }}>
                    {theme === t.id && <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}><Check className="w-3 h-3 text-white" /></div>}
                    {t.previewBg && (
                      <div className="w-full h-12 rounded-lg mb-3 flex items-center justify-center gap-2" style={{ background: t.previewBg }}>
                        <div className="w-8 h-5 rounded" style={{ background: t.previewSurface }} />
                        <div className="w-2 h-2 rounded-full" style={{ background: t.previewDot }} />
                      </div>
                    )}
                    <t.icon className="w-5 h-5 mb-2 text-brand" />
                    <span className="text-[14px] font-bold text-t1 block">{t.label}</span>
                    <span className="text-[11px] text-t3">{t.desc}</span>
                  </button>
                ))}
              </div>
              <p className="text-[13px] font-bold text-t1 mb-3">Preview</p>
              <div className="rounded-xl p-4 bg-surface-2 border border-border/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-brand">AK</div>
                  <div><p className="text-[13px] font-bold text-t1">Arjun Kumar</p><p className="text-[11px] text-t3">Student · DTU</p></div>
                </div>
                <p className="text-[12px] text-t2">This is how your feed looks in {theme === "system" ? "auto" : theme} mode.</p>
              </div>
            </div>
          )}

          {activeTab === "Privacy" && (
            <div className="rounded-2xl border border-border/30 p-6" style={{ background: "var(--surface)" }}>
              <h3 className="text-[16px] font-bold text-t1 mb-4">Privacy settings</h3>
              <Toggle label="Open to opportunities" desc="Show green dot on profile" />
              <Toggle label="Show profile in Explore" />
              <Toggle label="Show recruiter view count on work" />
              <Toggle label="Allow strand requests" />
              <Toggle label="Show Activity Score publicly" />
              <Toggle label="Show strand count publicly" />
            </div>
          )}

          {activeTab === "Institution" && (
            <div className="rounded-2xl border border-border/30 p-6" style={{ background: "var(--surface)" }}>
              <h3 className="text-[16px] font-bold text-t1 mb-1">Institution verification</h3>
              <p className="text-[13px] text-t2 mb-6">Get verified by your institution head.</p>
              <div className="rounded-xl p-4 bg-surface-2 border border-border/30 mb-4">
                <p className="text-[14px] font-bold text-t1">Delhi Technological University</p>
                <p className="text-[12px] text-t3">College · Delhi · Verified</p>
              </div>
              <Button className="active:scale-95 transition-all duration-200" onClick={() => toast.success("Tiik Approval request sent")}>Request Tiik Approval</Button>
              <button className="block text-[13px] mt-3 text-brand hover:underline cursor-pointer">Add another institution</button>
            </div>
          )}

          {activeTab === "Notifications" && (
            <div className="rounded-2xl border border-border/30 p-6" style={{ background: "var(--surface)" }}>
              <h3 className="text-[16px] font-bold text-t1 mb-4">Notification preferences</h3>
              <Toggle label="Recruiter views my work" />
              <Toggle label="Strand requests received" />
              <Toggle label="Tiik Approvals received" />
              <Toggle label="Opportunity matches" />
              <Toggle label="Replies to my comments" />
              <Toggle label="New Pings (unread)" />
              <Toggle label="Activity Score milestones" defaultOn={false} />
            </div>
          )}

          {activeTab === "Language" && (
            <div className="rounded-2xl border border-border/30 p-6" style={{ background: "var(--surface)" }}>
              <h3 className="text-[16px] font-bold text-t1 mb-4">Language preference</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {languages.map(l => (
                  <button key={l.code} onClick={() => { setSelectedLang(l.code); toast.success(`Language: ${l.native}`); }}
                    className="rounded-xl p-4 text-center transition-all duration-200 cursor-pointer active:scale-[0.98] border border-border/30"
                    style={{ background: selectedLang === l.code ? "var(--brand-dim)" : "var(--surface-2)", borderColor: selectedLang === l.code ? "var(--brand)" : undefined }}>
                    <span className="text-lg font-bold text-t1 block">{l.label}</span>
                    <span className="text-[12px] text-t3">{l.native}</span>
                  </button>
                ))}
              </div>
              <Button className="active:scale-95 transition-all duration-200" onClick={() => toast.success("Language saved")}>Save language</Button>
            </div>
          )}

          {activeTab === "Account" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border/30 p-6" style={{ background: "var(--surface)" }}>
                <h3 className="text-[16px] font-bold text-t1 mb-4">Account</h3>
                {[{ icon: Mail, label: "arjun@example.com", sub: "Email", btn: "Change" }, { icon: Key, label: "Password", sub: "Last changed 3 months ago", btn: "Reset" }, { icon: Download, label: "Download my data", sub: "Export all your data", btn: "Export" }].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-3 border-b border-border/30 last:border-b-0">
                    <div className="flex items-center gap-3"><r.icon className="w-4 h-4 text-t3" /><div><p className="text-[14px] text-t1">{r.label}</p><p className="text-[12px] text-t3">{r.sub}</p></div></div>
                    <Button variant="secondary" size="xs" className="active:scale-95 transition-all duration-200" onClick={() => toast.info(`${r.btn}...`)}>{r.btn}</Button>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-5" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.12)" }}>
                <h3 className="text-[16px] font-bold mb-1" style={{ color: "#DC2626" }}>Delete account</h3>
                <p className="text-[13px] text-t2 mb-4">Permanently removes all your data. This cannot be undone.</p>
                <Button variant="destructive" className="active:scale-95 transition-all duration-200 hover:bg-[#DC2626]/90" onClick={() => setShowDeleteModal(true)}>Delete my account</Button>
              </div>
              <Button variant="secondary" onClick={handleSignOut} className="w-full gap-2 active:scale-95 transition-all duration-200" style={{ color: "#DC2626", borderColor: "rgba(220,38,38,0.25)" }}>
                <LogOut className="w-4 h-4" /> Sign out of all devices
              </Button>
            </div>
          )}

          {/* Mobile nav */}
          <div className="md:hidden flex flex-wrap gap-2 mb-6">
            {navItems.map(item => (
              <button key={item} onClick={() => setActiveTab(item)}
                className={`text-[12px] px-3 h-8 rounded-full border transition-all duration-200 cursor-pointer active:scale-95 ${
                  activeTab === item ? "bg-brand border-brand text-white font-bold" : "bg-surface-2 border-border/30 text-t2"
                }`}>{item}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }} onClick={() => setShowDeleteModal(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl p-6 max-w-md w-full border border-border/30"
            style={{ background: "var(--surface)", boxShadow: "0 24px 48px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}
          >
            <AlertTriangle className="w-10 h-10 mx-auto mb-4" style={{ color: "#DC2626" }} />
            <h3 className="text-[18px] font-bold text-center text-t1 mb-2">Delete account?</h3>
            <p className="text-[13px] text-center text-t2 mb-4">Your account will be permanently deleted in 30 days. Type your password to confirm.</p>
            <p className="text-[12px] text-t3 mb-2">Type DELETE to confirm</p>
            <Input value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="DELETE" className="h-11 mb-4 bg-surface-2 border-border/30" />
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 active:scale-95 transition-all duration-200" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="destructive" disabled={deleteText !== "DELETE"} className="flex-1 active:scale-95 transition-all duration-200"
                onClick={() => { setShowDeleteModal(false); toast.success("Account scheduled for deletion in 30 days"); }}>
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default SettingsPage;
