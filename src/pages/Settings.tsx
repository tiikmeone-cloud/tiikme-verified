import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon, Check, GraduationCap, Briefcase, Rocket, Laptop, Coffee,
  Sun, Moon, Monitor, Palette, Mail, Key, Download, Trash2, LogOut, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const navItems = ["Profile", "My Journey", "Appearance", "Privacy", "Institution", "Notifications", "Language", "Account"];

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

const applyTheme = (t: string) => {
  const resolved = t === "system"
    ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : t;
  document.documentElement.setAttribute("data-theme", resolved);
};

const Toggle = ({ label, desc, defaultOn = true }: { label: string; desc?: string; defaultOn?: boolean }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <span className="text-[14px] text-t1">{label}</span>
        {desc && <p className="text-[12px] text-t3">{desc}</p>}
      </div>
      <button onClick={() => { setOn(!on); toast.success("Preference saved"); }}
        className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors"
        style={{ backgroundColor: on ? "hsl(var(--brand))" : "var(--border-2)" }}>
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
  const [profile, setProfile] = useState({
    name: "Arjun Kumar", headline: "Final year CSE student building at the intersection of health and technology.",
    bio: "", institution: "Delhi Technological University", city: "Delhi", state: "Delhi", slug: "arjunkumar",
  });

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

  const inputClass = "h-12 bg-surface-2 border-border-2 text-t1 placeholder:text-t3";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-6 h-6 text-brand" />
        <h1 className="text-[20px] font-bold text-t1">Settings</h1>
      </div>

      <div className="flex gap-6">
        {/* Left nav */}
        <div className="hidden md:block w-[200px] shrink-0">
          <div className="space-y-1 sticky top-20">
            {navItems.map(item => (
              <button key={item} onClick={() => setActiveTab(item)}
                className="w-full text-left text-[13px] px-4 py-2.5 rounded-xl transition-all"
                style={{
                  background: activeTab === item ? "var(--brand-dim)" : "transparent",
                  color: activeTab === item ? "hsl(var(--brand))" : "var(--text-2)",
                  fontWeight: activeTab === item ? 700 : 500,
                  borderLeft: activeTab === item ? "3px solid hsl(var(--brand))" : "3px solid transparent",
                }}>
                {item}
              </button>
            ))}
            <div className="border-t border-border my-3" />
            <button onClick={handleSignOut}
              className="w-full text-left text-[13px] px-4 py-2.5 rounded-xl text-[#DC2626] hover:bg-[rgba(220,38,38,0.1)] transition-all flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* PROFILE */}
          {activeTab === "Profile" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-2xl p-6 bg-surface border border-border" style={{ borderRadius: 16 }}>
                <h3 className="text-[16px] font-bold text-t1 mb-1">Profile information</h3>
                <p className="text-[13px] text-t2 mb-6">How you appear to students, recruiters, and professionals.</p>
                <div className="space-y-4">
                  <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="Full name" className={inputClass} />
                  <Input value={profile.headline} onChange={e => setProfile({ ...profile, headline: e.target.value })} placeholder="Headline" className={inputClass} />
                  <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Bio" rows={3}
                    className="w-full bg-surface-2 border border-border-2 rounded-xl p-4 text-[14px] text-t1 outline-none resize-none placeholder:text-t3" />
                  <Input value={profile.institution} onChange={e => setProfile({ ...profile, institution: e.target.value })} placeholder="Institution" className={inputClass} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} placeholder="City" className={inputClass} />
                    <Input value={profile.state} onChange={e => setProfile({ ...profile, state: e.target.value })} placeholder="State" className={inputClass} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-t3">tiikme.in/</span>
                    <Input value={profile.slug} onChange={e => setProfile({ ...profile, slug: e.target.value })} className={`${inputClass} flex-1`} />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => toast.success("Profile saved")}>Save changes</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* MY JOURNEY */}
          {activeTab === "My Journey" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-2xl p-5 bg-surface border border-brand" style={{ borderRadius: 16 }}>
                <h3 className="text-[16px] font-bold text-t1 mb-1">My journey</h3>
                <p className="text-[13px] text-t2">Update where you are. Your project history always stays — Tiikme travels with you.</p>
              </div>
              <div>
                <p className="text-[13px] font-bold text-t1 mb-3">Current year</p>
                <select className="w-full h-12 rounded-xl px-3 bg-surface-2 border border-border-2 text-t1 text-sm mb-6">
                  {["1st Year", "2nd Year", "3rd Year", "4th Year", "Final Year", "Postgraduate", "Alumni"].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <p className="text-[13px] font-bold text-t1 mb-3">What happens next?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {journeyCards.map(card => (
                  <button key={card.id} onClick={() => setJourneyChoice(card.id)}
                    className="rounded-2xl p-5 text-left transition-all relative bg-surface border"
                    style={{
                      borderColor: journeyChoice === card.id ? "hsl(var(--brand))" : "var(--border)",
                      background: journeyChoice === card.id ? "var(--brand-dim)" : "var(--surface)",
                      borderRadius: 16,
                    }}>
                    {journeyChoice === card.id && <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                    <card.icon className="w-7 h-7 text-brand mb-3" />
                    <h4 className="text-[14px] font-bold text-t1 mb-1">{card.title}</h4>
                    <p className="text-[12px] text-t2">{card.desc}</p>
                  </button>
                ))}
              </div>
              {journeyChoice && <Button className="w-full mt-4" onClick={() => toast.success("Journey updated!")}>Update my journey</Button>}
              <p className="text-[12px] text-t3 text-center">All your project history is preserved regardless of journey change.</p>
            </motion.div>
          )}

          {/* APPEARANCE */}
          {activeTab === "Appearance" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-2xl p-6 bg-surface border border-border" style={{ borderRadius: 16 }}>
                <div className="flex items-center gap-2 mb-1"><Palette className="w-5 h-5 text-brand" /><h3 className="text-[16px] font-bold text-t1">Appearance</h3></div>
                <p className="text-[13px] text-t2 mb-6">Customize how Tiikme looks for you.</p>

                <p className="text-[13px] font-bold text-t1 mb-3">Theme</p>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { id: "dark", label: "Dark", icon: Moon, desc: "Default, easy on the eyes" },
                    { id: "light", label: "Light", icon: Sun, desc: "Bright and clean" },
                    { id: "system", label: "System", icon: Monitor, desc: "Match your device" },
                  ].map(t => (
                    <button key={t.id} onClick={() => handleThemeChange(t.id)}
                      className="rounded-xl p-4 text-left transition-all bg-surface-2 border"
                      style={{
                        borderColor: theme === t.id ? "hsl(var(--brand))" : "var(--border-2)",
                        background: theme === t.id ? "var(--brand-dim)" : "var(--surface-2)",
                        borderRadius: 12,
                      }}>
                      {theme === t.id && <div className="float-right w-5 h-5 rounded-full bg-brand flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                      <t.icon className="w-6 h-6 text-brand mb-2" />
                      <span className="text-[14px] font-bold text-t1 block">{t.label}</span>
                      <span className="text-[11px] text-t3">{t.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Preview */}
                <p className="text-[13px] font-bold text-t1 mb-3">Preview</p>
                <div className="rounded-xl p-4 bg-surface-2 border border-border-2 mb-6" style={{ borderRadius: 12 }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-[10px] font-bold">AK</div>
                    <div>
                      <p className="text-[13px] font-bold text-t1">Arjun Kumar</p>
                      <p className="text-[11px] text-t3">Student · DTU</p>
                    </div>
                  </div>
                  <p className="text-[12px] text-t2">This is how your feed will look in {theme === "system" ? "auto" : theme} mode.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* PRIVACY */}
          {activeTab === "Privacy" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rounded-2xl p-6 bg-surface border border-border" style={{ borderRadius: 16 }}>
                <h3 className="text-[16px] font-bold text-t1 mb-4">Privacy settings</h3>
                <Toggle label="Open to opportunities" desc="Show green dot on profile" />
                <Toggle label="Show profile in Explore" desc="People can discover you" />
                <Toggle label="Show recruiter view count on work" desc="Visible on your work items" />
                <Toggle label="Allow strand requests" desc="Receive new connection requests" />
                <Toggle label="Show Activity Score publicly" desc="Others can see your score" />
                <Toggle label="Show strand count publicly" desc="Others can see your connections" />
              </div>
            </motion.div>
          )}

          {/* INSTITUTION */}
          {activeTab === "Institution" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rounded-2xl p-6 bg-surface border border-border" style={{ borderRadius: 16 }}>
                <h3 className="text-[16px] font-bold text-t1 mb-1">Institution verification</h3>
                <p className="text-[13px] text-t2 mb-6">Get verified by your institution head for higher trust.</p>
                <div className="rounded-xl p-4 bg-surface-2 border border-border-2 mb-4" style={{ borderRadius: 12 }}>
                  <p className="text-[14px] font-bold text-t1">Delhi Technological University</p>
                  <p className="text-[12px] text-t3">College · Delhi · Verified ✓</p>
                </div>
                <Button onClick={() => toast.success("Tiik Approval request sent to institution head")}>Request Tiik Approval</Button>
                <button className="block text-[13px] text-brand mt-3 hover:underline">Add another institution</button>
              </div>
            </motion.div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === "Notifications" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rounded-2xl p-6 bg-surface border border-border" style={{ borderRadius: 16 }}>
                <h3 className="text-[16px] font-bold text-t1 mb-4">Notification preferences</h3>
                <Toggle label="Recruiter views my work" />
                <Toggle label="Strand requests received" />
                <Toggle label="Tiik Approvals received" />
                <Toggle label="Opportunity matches" />
                <Toggle label="Replies to my comments" />
                <Toggle label="New Pings (unread)" />
                <Toggle label="Activity Score milestones" defaultOn={false} />
              </div>
            </motion.div>
          )}

          {/* LANGUAGE */}
          {activeTab === "Language" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="rounded-2xl p-6 bg-surface border border-border" style={{ borderRadius: 16 }}>
                <h3 className="text-[16px] font-bold text-t1 mb-4">Language preference</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {languages.map(lang => (
                    <button key={lang.code} onClick={() => { setSelectedLang(lang.code); toast.success(`Language set to ${lang.native}`); }}
                      className="rounded-xl p-4 text-center transition-all bg-surface-2 border"
                      style={{
                        borderColor: selectedLang === lang.code ? "hsl(var(--brand))" : "var(--border-2)",
                        background: selectedLang === lang.code ? "var(--brand-dim)" : "var(--surface-2)",
                        borderRadius: 12,
                      }}>
                      <span className="text-lg font-bold text-t1 block">{lang.label}</span>
                      <span className="text-[12px] text-t3">{lang.native}</span>
                    </button>
                  ))}
                </div>
                <Button onClick={() => toast.success("Language saved")}>Save language</Button>
              </div>
            </motion.div>
          )}

          {/* ACCOUNT */}
          {activeTab === "Account" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="rounded-2xl p-6 bg-surface border border-border" style={{ borderRadius: 16 }}>
                <h3 className="text-[16px] font-bold text-t1 mb-4">Account</h3>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-t3" /><div><p className="text-[14px] text-t1">arjun@example.com</p><p className="text-[12px] text-t3">Email address</p></div></div>
                  <Button variant="secondary" size="xs" onClick={() => toast.info("Opening email change...")}>Change</Button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3"><Key className="w-4 h-4 text-t3" /><div><p className="text-[14px] text-t1">Password</p><p className="text-[12px] text-t3">Last changed 3 months ago</p></div></div>
                  <Button variant="secondary" size="xs" onClick={() => toast.info("Opening password reset...")}>Reset</Button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div className="flex items-center gap-3"><Download className="w-4 h-4 text-t3" /><div><p className="text-[14px] text-t1">Download my data</p><p className="text-[12px] text-t3">Export all your profile and project data</p></div></div>
                  <Button variant="secondary" size="xs" onClick={() => toast.success("Download started")}>Export</Button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="rounded-2xl p-6 border border-[rgba(220,38,38,0.3)] bg-[rgba(220,38,38,0.05)]" style={{ borderRadius: 16 }}>
                <h3 className="text-[16px] font-bold text-[#DC2626] mb-1">Danger zone</h3>
                <p className="text-[13px] text-t3 mb-4">Permanently removes all your data. This cannot be undone.</p>
                <div className="flex gap-3">
                  <Button variant="destructive" size="sm" onClick={() => setShowDeleteModal(true)}>
                    <Trash2 className="w-4 h-4" /> Delete my account
                  </Button>
                  <Button variant="secondary" size="sm" className="text-[#DC2626] border-[rgba(220,38,38,0.3)]" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" /> Sign out of all devices
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl p-6 w-full max-w-md bg-surface border border-border" style={{ borderRadius: 16 }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
              <h3 className="text-[16px] font-bold text-[#DC2626]">Delete account</h3>
            </div>
            <p className="text-[13px] text-t2 mb-4">Your account will be permanently deleted in 30 days. This cannot be undone.</p>
            <p className="text-[13px] text-t1 font-bold mb-2">Type DELETE to confirm</p>
            <Input value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="DELETE" className="h-12 bg-surface-2 border-border-2 mb-4" />
            <div className="flex gap-3">
              <Button variant="destructive" disabled={deleteText !== "DELETE"} onClick={() => { toast.error("Account scheduled for deletion in 30 days"); setShowDeleteModal(false); }}>
                Confirm deletion
              </Button>
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
