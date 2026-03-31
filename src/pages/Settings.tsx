import { useState, useEffect } from "react";
import { Check, GraduationCap, Briefcase, Rocket, Laptop, Coffee, Sun, Moon, Monitor, Palette, Mail, Key, Download, Trash2, LogOut, AlertTriangle, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
    <div className="flex items-center justify-between py-3">
      <div><span className="text-[14px]" style={{ color: "var(--text-1)" }}>{label}</span>{desc && <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{desc}</p>}</div>
      <button onClick={() => { setOn(!on); toast.success("Preference saved"); }} className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors" style={{ background: on ? "var(--brand)" : "var(--border-2)" }}>
        <div className="w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: on ? "translateX(20px)" : "translateX(0)" }} />
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
  const [profile, setProfile] = useState({ name: "Arjun Kumar", headline: "Final year CSE student building at the intersection of health and technology.", bio: "", institution: "Delhi Technological University", city: "Delhi", state: "Delhi", slug: "arjunkumar" });

  useEffect(() => { applyTheme(theme); }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("tiikme-theme", newTheme);
    applyTheme(newTheme);
    toast.success(`Theme set to ${newTheme}`);
  };

  const handleSignOut = () => {
    const savedTheme = localStorage.getItem("tiikme-theme");
    localStorage.clear();
    if (savedTheme) localStorage.setItem("tiikme-theme", savedTheme);
    toast.success("Signed out");
    navigate("/signin");
  };

  const cardStyle: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18 };
  const inputStyle = "h-11";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <SlidersHorizontal className="w-6 h-6" style={{ color: "var(--brand)" }} />
        <h1 className="text-[20px] font-extrabold" style={{ color: "var(--text-1)" }}>Settings</h1>
      </div>
      <div className="flex gap-6">
        {/* Left nav */}
        <div className="hidden md:block w-[200px] shrink-0">
          <div className="space-y-1 sticky top-20">
            {navItems.map(item => (
              <button key={item} onClick={() => setActiveTab(item)} className="w-full text-left text-[13px] px-4 py-2.5 rounded-xl transition-all" style={{
                background: activeTab === item ? "var(--brand-dim)" : "transparent",
                color: activeTab === item ? "var(--brand)" : "var(--text-2)",
                fontWeight: activeTab === item ? 700 : 500,
                borderLeft: activeTab === item ? "3px solid var(--brand)" : "3px solid transparent",
              }}>{item}</button>
            ))}
            <div className="border-t my-3" style={{ borderColor: "var(--border)" }} />
            <button onClick={handleSignOut} className="w-full text-left text-[13px] px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors" style={{ color: "#DC2626" }}>
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === "Profile" && (
            <div style={cardStyle} className="p-6">
              <h3 className="text-[16px] font-bold mb-1" style={{ color: "var(--text-1)" }}>Profile information</h3>
              <p className="text-[13px] mb-6" style={{ color: "var(--text-2)" }}>How you appear to others.</p>
              <div className="space-y-4">
                <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Full name" className={inputStyle} style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                <Input value={profile.headline} onChange={e => setProfile({ ...profile, headline: e.target.value })} placeholder="Headline" className={inputStyle} style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Bio" rows={3} className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                <div className="grid grid-cols-2 gap-4">
                  <Input value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} className={inputStyle} style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                  <Input value={profile.state} onChange={e => setProfile({ ...profile, state: e.target.value })} className={inputStyle} style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px]" style={{ color: "var(--text-3)" }}>tiikme.in/</span>
                  <Input value={profile.slug} onChange={e => setProfile({ ...profile, slug: e.target.value })} className={`${inputStyle} flex-1`} style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
                </div>
                <div className="flex justify-end"><Button onClick={() => toast.success("Profile saved")}>Save changes</Button></div>
              </div>
            </div>
          )}

          {activeTab === "My Journey" && (
            <div className="space-y-6">
              <div style={{ ...cardStyle, borderColor: "var(--brand)" }} className="p-5">
                <h3 className="text-[16px] font-bold mb-1" style={{ color: "var(--text-1)" }}>My journey</h3>
                <p className="text-[13px]" style={{ color: "var(--text-2)" }}>Update where you are. Your project history always stays.</p>
              </div>
              <p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>What happens next?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {journeyCards.map(c => (
                  <button key={c.id} onClick={() => setJourneyChoice(c.id)} className="rounded-[18px] p-5 text-left transition-all relative" style={{ background: journeyChoice === c.id ? "var(--brand-dim)" : "var(--surface)", border: `1.5px solid ${journeyChoice === c.id ? "var(--brand)" : "var(--border)"}` }}>
                    {journeyChoice === c.id && <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}><Check className="w-3 h-3 text-white" /></div>}
                    <c.icon className="w-7 h-7 mb-3" style={{ color: "var(--brand)" }} />
                    <h4 className="text-[14px] font-bold mb-1" style={{ color: "var(--text-1)" }}>{c.title}</h4>
                    <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{c.desc}</p>
                  </button>
                ))}
              </div>
              {journeyChoice && <Button className="w-full" onClick={() => toast.success("Journey updated!")}>Update my journey</Button>}
              <p className="text-[12px] text-center" style={{ color: "var(--text-3)" }}>All your project history is preserved.</p>
            </div>
          )}

          {activeTab === "Appearance" && (
            <div style={cardStyle} className="p-6">
              <div className="flex items-center gap-2 mb-1"><Palette className="w-5 h-5" style={{ color: "var(--brand)" }} /><h3 className="text-[16px] font-bold" style={{ color: "var(--text-1)" }}>Appearance</h3></div>
              <p className="text-[13px] mb-6" style={{ color: "var(--text-2)" }}>Customize how Tiikme looks.</p>
              <p className="text-[13px] font-bold mb-3" style={{ color: "var(--text-1)" }}>Theme</p>
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[
                  { id: "dark", label: "Dark", icon: Moon, desc: "Krishna Blue", previewBg: "#04061A", previewSurface: "#080B2A", previewDot: "#3D5AF1" },
                  { id: "light", label: "Light", icon: Sun, desc: "Anjaneyam Orange", previewBg: "#FFF8F2", previewSurface: "#FFFFFF", previewDot: "#E8580A" },
                  { id: "system", label: "System", icon: Monitor, desc: "Match device" },
                ].map(t => (
                  <button key={t.id} onClick={() => handleThemeChange(t.id)} className="rounded-xl p-4 text-left transition-all relative overflow-hidden" style={{ background: theme === t.id ? "var(--brand-dim)" : "var(--surface-2)", border: `1.5px solid ${theme === t.id ? "var(--brand)" : "var(--border-2)"}` }}>
                    {theme === t.id && <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}><Check className="w-3 h-3 text-white" /></div>}
                    {t.previewBg && (
                      <div className="w-full h-12 rounded-lg mb-3 flex items-center justify-center gap-2" style={{ background: t.previewBg }}>
                        <div className="w-8 h-5 rounded" style={{ background: t.previewSurface }} />
                        <div className="w-2 h-2 rounded-full" style={{ background: t.previewDot }} />
                      </div>
                    )}
                    <t.icon className="w-5 h-5 mb-2" style={{ color: "var(--brand)" }} />
                    <span className="text-[14px] font-bold block" style={{ color: "var(--text-1)" }}>{t.label}</span>
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>{t.desc}</span>
                  </button>
                ))}
              </div>
              <p className="text-[13px] font-bold mb-3" style={{ color: "var(--text-1)" }}>Preview</p>
              <div className="rounded-xl p-4 mb-6" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "var(--brand)" }}>AK</div>
                  <div><p className="text-[13px] font-bold" style={{ color: "var(--text-1)" }}>Arjun Kumar</p><p className="text-[11px]" style={{ color: "var(--text-3)" }}>Student · DTU</p></div>
                </div>
                <p className="text-[12px]" style={{ color: "var(--text-2)" }}>This is how your feed looks in {theme === "system" ? "auto" : theme} mode.</p>
              </div>
            </div>
          )}

          {activeTab === "Privacy" && (<div style={cardStyle} className="p-6"><h3 className="text-[16px] font-bold mb-4" style={{ color: "var(--text-1)" }}>Privacy settings</h3><Toggle label="Open to opportunities" desc="Show green dot on profile" /><Toggle label="Show profile in Explore" /><Toggle label="Show recruiter view count on work" /><Toggle label="Allow strand requests" /><Toggle label="Show Activity Score publicly" /><Toggle label="Show strand count publicly" /></div>)}

          {activeTab === "Institution" && (<div style={cardStyle} className="p-6"><h3 className="text-[16px] font-bold mb-1" style={{ color: "var(--text-1)" }}>Institution verification</h3><p className="text-[13px] mb-6" style={{ color: "var(--text-2)" }}>Get verified by your institution head.</p><div className="rounded-xl p-4 mb-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }}><p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>Delhi Technological University</p><p className="text-[12px]" style={{ color: "var(--text-3)" }}>College · Delhi · Verified</p></div><Button onClick={() => toast.success("Tiik Approval request sent")}>Request Tiik Approval</Button><button className="block text-[13px] mt-3" style={{ color: "var(--brand)" }}>Add another institution</button></div>)}

          {activeTab === "Notifications" && (<div style={cardStyle} className="p-6"><h3 className="text-[16px] font-bold mb-4" style={{ color: "var(--text-1)" }}>Notification preferences</h3><Toggle label="Recruiter views my work" /><Toggle label="Strand requests received" /><Toggle label="Tiik Approvals received" /><Toggle label="Opportunity matches" /><Toggle label="Replies to my comments" /><Toggle label="New Pings (unread)" /><Toggle label="Activity Score milestones" defaultOn={false} /></div>)}

          {activeTab === "Language" && (<div style={cardStyle} className="p-6"><h3 className="text-[16px] font-bold mb-4" style={{ color: "var(--text-1)" }}>Language preference</h3><div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">{languages.map(l => (<button key={l.code} onClick={() => { setSelectedLang(l.code); toast.success(`Language: ${l.native}`); }} className="rounded-xl p-4 text-center transition-all" style={{ background: selectedLang === l.code ? "var(--brand-dim)" : "var(--surface-2)", border: `1.5px solid ${selectedLang === l.code ? "var(--brand)" : "var(--border-2)"}` }}><span className="text-lg font-bold block" style={{ color: "var(--text-1)" }}>{l.label}</span><span className="text-[12px]" style={{ color: "var(--text-3)" }}>{l.native}</span></button>))}</div><Button onClick={() => toast.success("Language saved")}>Save language</Button></div>)}

          {activeTab === "Account" && (
            <div className="space-y-6">
              <div style={cardStyle} className="p-6">
                <h3 className="text-[16px] font-bold mb-4" style={{ color: "var(--text-1)" }}>Account</h3>
                {[{ icon: Mail, label: "arjun@example.com", sub: "Email", btn: "Change" }, { icon: Key, label: "Password", sub: "Last changed 3 months ago", btn: "Reset" }, { icon: Download, label: "Download my data", sub: "Export all your data", btn: "Export" }].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-3 border-b" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-3"><r.icon className="w-4 h-4" style={{ color: "var(--text-3)" }} /><div><p className="text-[14px]" style={{ color: "var(--text-1)" }}>{r.label}</p><p className="text-[12px]" style={{ color: "var(--text-3)" }}>{r.sub}</p></div></div>
                    <Button variant="secondary" size="xs" onClick={() => toast.info(`${r.btn}...`)}>{r.btn}</Button>
                  </div>
                ))}
              </div>
              <div className="rounded-[18px] p-5" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.12)" }}>
                <h3 className="text-[16px] font-bold mb-1" style={{ color: "#DC2626" }}>Delete account</h3>
                <p className="text-[13px] mb-4" style={{ color: "var(--text-2)" }}>Permanently removes all your data. This cannot be undone.</p>
                <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>Delete my account</Button>
              </div>
              <Button variant="secondary" onClick={handleSignOut} className="w-full gap-2" style={{ color: "#DC2626", borderColor: "rgba(220,38,38,0.25)" }}>
                <LogOut className="w-4 h-4" /> Sign out of all devices
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(4,6,26,0.7)", backdropFilter: "blur(12px)" }} onClick={() => setShowDeleteModal(false)}>
          <div className="rounded-[20px] p-6 max-w-md w-full" style={{ background: "var(--surface-2)", border: "1px solid var(--border-2)" }} onClick={e => e.stopPropagation()}>
            <AlertTriangle className="w-10 h-10 mx-auto mb-4" style={{ color: "#DC2626" }} />
            <h3 className="text-[18px] font-bold text-center mb-2" style={{ color: "var(--text-1)" }}>Delete account?</h3>
            <p className="text-[13px] text-center mb-4" style={{ color: "var(--text-2)" }}>Your account will be permanently deleted in 30 days.</p>
            <p className="text-[12px] mb-2" style={{ color: "var(--text-3)" }}>Type DELETE to confirm</p>
            <Input value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="DELETE" className="h-11 mb-4" style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)" }} />
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" disabled={deleteText !== "DELETE"} onClick={() => { toast.success("Account scheduled for deletion"); setShowDeleteModal(false); }}>Confirm deletion</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
