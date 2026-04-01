import { useState, useEffect } from "react";
import { Check, GraduationCap, Briefcase, Rocket, Laptop, Coffee, Sun, Moon, Monitor, Palette, Mail, Key, Download, Trash2, AlertTriangle, Camera, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const navItems = ["Account", "My Journey", "Privacy", "Notifications"];

const journeyCards = [
  { id: "higher", icon: GraduationCap, title: "Higher studies", desc: "M.Tech, MBA, PhD — stay as Student" },
  { id: "job", icon: Briefcase, title: "Got a job", desc: "Become Professional" },
  { id: "startup", icon: Rocket, title: "Starting a startup", desc: "Become Founder" },
  { id: "freelance", icon: Laptop, title: "Freelancing", desc: "Become Professional" },
  { id: "break", icon: Coffee, title: "Taking a break", desc: "Become Alumni" },
];

const applyTheme = (t: string) => {
  const resolved = t === "system" ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : t;
  document.documentElement.setAttribute("data-theme", resolved);
};

const Toggle = ({ label, desc, defaultOn = true }: { label: string; desc?: string; defaultOn?: boolean }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3.5 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <div><span className="text-[14px] font-medium text-t1">{label}</span>{desc && <p className="text-[12px] text-t3 mt-0.5">{desc}</p>}</div>
      <button onClick={() => { setOn(!on); toast.success("Preference saved"); }}
        className="w-11 h-6 rounded-full flex items-center px-0.5 transition-all duration-200 cursor-pointer active:scale-95"
        style={{ background: on ? "var(--brand)" : "var(--border-2)" }}>
        <div className="w-5 h-5 rounded-full bg-white transition-transform duration-200" style={{ transform: on ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );
};

const OTPInput = ({ onVerify }: { onVerify: () => void }) => {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [verifying, setVerifying] = useState(false);

  const handleChange = (i: number, val: string) => {
    if (val.length > 1) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 3) {
      const el = document.getElementById(`otp-${i + 1}`);
      el?.focus();
    }
  };

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      onVerify();
      toast.success("Verified successfully");
    }, 1200);
  };

  return (
    <div className="mt-4 glass-card p-5 space-y-4">
      <p className="text-[13px] font-semibold text-t1">Enter verification code</p>
      <p className="text-[12px] text-t3">We sent a 4-digit code to your email.</p>
      <div className="flex gap-3 justify-center py-2">
        {digits.map((d, i) => (
          <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
            onChange={e => handleChange(i, e.target.value)}
            className="w-12 h-14 text-center text-[22px] font-bold rounded-xl border-2 outline-none transition-all duration-200 text-t1"
            style={{ background: "var(--surface-2)", borderColor: d ? "var(--brand)" : "var(--border-2)" }}
          />
        ))}
      </div>
      <Button className="w-full rounded-full active:scale-95 transition-all duration-200" disabled={digits.some(d => !d) || verifying} onClick={handleVerify}>
        {verifying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Verify"}
      </Button>
    </div>
  );
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Account");
  const [journeyChoice, setJourneyChoice] = useState<string | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("tiikme-theme") || "dark");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [showOTP, setShowOTP] = useState<string | null>(null);
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
      className="max-w-5xl mx-auto px-4 md:px-8 py-8"
    >
      <h1 className="text-[22px] font-extrabold text-t1 mb-6">Settings</h1>

      <div className="flex gap-6">
        {/* Desktop left nav */}
        <div className="hidden md:block w-[200px] shrink-0">
          <div className="space-y-0.5 sticky top-20 glass-card overflow-hidden p-1">
            {navItems.map(item => (
              <button key={item} onClick={() => setActiveTab(item)}
                className={`w-full text-left text-[13px] px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                  activeTab === item ? "font-bold" : "text-t2"
                }`}
                style={activeTab === item ? { background: "var(--brand-dim)", color: "var(--brand)" } : {}}>
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Mobile tab chips */}
          <div className="md:hidden flex flex-wrap gap-2 mb-6">
            {navItems.map(item => (
              <button key={item} onClick={() => setActiveTab(item)}
                className={`text-[12px] px-3 h-8 rounded-full transition-all duration-200 cursor-pointer active:scale-95 ${
                  activeTab === item ? "font-bold text-white" : "text-t2"
                }`}
                style={activeTab === item ? { background: "var(--brand)" } : { background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                {item}
              </button>
            ))}
          </div>

          {activeTab === "Account" && (
            <div className="space-y-6">
              {/* Avatar */}
              <div className="glass-card p-6">
                <h3 className="text-[16px] font-bold text-t1 mb-5">Profile</h3>
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative group cursor-pointer">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: "var(--brand)" }}>AK</div>
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-t1">Arjun Kumar</p>
                    <p className="text-[12px] text-t3">Click avatar to change</p>
                  </div>
                </div>

                {/* Profile fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5">Display Name</label>
                    <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="h-11 bg-surface-2 border-border/30" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5">Headline</label>
                    <Input value={profile.headline} onChange={e => setProfile({ ...profile, headline: e.target.value })} className="h-11 bg-surface-2 border-border/30" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5">Bio</label>
                    <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell people about yourself..." rows={3} className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none bg-surface-2 border border-border/30 text-t1 placeholder:text-t3 focus:border-brand transition-all duration-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5">City</label><Input value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} className="h-11 bg-surface-2 border-border/30" /></div>
                    <div><label className="text-[11px] font-bold uppercase tracking-wider text-t3 block mb-1.5">State</label><Input value={profile.state} onChange={e => setProfile({ ...profile, state: e.target.value })} className="h-11 bg-surface-2 border-border/30" /></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-t3">tiikme.in/</span>
                    <Input value={profile.slug} onChange={e => setProfile({ ...profile, slug: e.target.value })} className="h-11 flex-1 bg-surface-2 border-border/30" />
                  </div>
                  <div className="flex justify-end"><Button className="rounded-full active:scale-95 transition-all duration-200" onClick={() => toast.success("Profile saved")}>Save changes</Button></div>
                </div>
              </div>

              {/* Security */}
              <div className="glass-card p-6">
                <h3 className="text-[16px] font-bold text-t1 mb-4">Security</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-t3" /><div><p className="text-[14px] text-t1">arjun@example.com</p><p className="text-[12px] text-t3">Primary email</p></div></div>
                    <Button variant="ghost" size="sm" className="rounded-full active:scale-95 transition-all duration-200" onClick={() => setShowOTP("email")}>Update</Button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3"><Key className="w-4 h-4 text-t3" /><div><p className="text-[14px] text-t1">Password</p><p className="text-[12px] text-t3">Last changed 3 months ago</p></div></div>
                    <Button variant="ghost" size="sm" className="rounded-full active:scale-95 transition-all duration-200" onClick={() => setShowOTP("password")}>Update</Button>
                  </div>
                  {showOTP && <OTPInput onVerify={() => setShowOTP(null)} />}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3"><Download className="w-4 h-4 text-t3" /><div><p className="text-[14px] text-t1">Download my data</p><p className="text-[12px] text-t3">Export all your data</p></div></div>
                    <Button variant="ghost" size="sm" className="rounded-full active:scale-95 transition-all duration-200" onClick={() => toast.info("Preparing export...")}>Export</Button>
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4"><Palette className="w-5 h-5 text-brand" /><h3 className="text-[16px] font-bold text-t1">Appearance</h3></div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "dark", label: "Dark", icon: Moon, desc: "Krishna Blue", previewBg: "#04061A", previewDot: "#3D5AF1" },
                    { id: "light", label: "Light", icon: Sun, desc: "Anjaneyam Orange", previewBg: "#FFF8F2", previewDot: "#E8580A" },
                    { id: "system", label: "System", icon: Monitor, desc: "Match device" },
                  ].map(t => (
                    <button key={t.id} onClick={() => handleThemeChange(t.id)}
                      className="glass-card p-4 text-left transition-all duration-200 relative overflow-hidden cursor-pointer active:scale-[0.98]"
                      style={theme === t.id ? { borderColor: "var(--brand)", boxShadow: "0 0 0 1px var(--brand)" } : {}}>
                      {theme === t.id && <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}><Check className="w-3 h-3 text-white" /></div>}
                      {t.previewBg && (
                        <div className="w-full h-10 rounded-lg mb-3 flex items-center justify-center gap-2" style={{ background: t.previewBg }}>
                          <div className="w-2 h-2 rounded-full" style={{ background: t.previewDot }} />
                        </div>
                      )}
                      <t.icon className="w-5 h-5 mb-2 text-brand" />
                      <span className="text-[13px] font-bold text-t1 block">{t.label}</span>
                      <span className="text-[11px] text-t3">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Danger zone */}
              <div className="glass-card p-6" style={{ borderColor: "rgba(220,38,38,0.15)" }}>
                <h3 className="text-[16px] font-bold mb-1" style={{ color: "#DC2626" }}>Danger zone</h3>
                <p className="text-[13px] text-t2 mb-4">Permanently removes all your data. This cannot be undone.</p>
                <div className="flex gap-3">
                  <Button variant="destructive" className="rounded-full active:scale-95 transition-all duration-200" onClick={() => setShowDeleteModal(true)}>Delete my account</Button>
                  <Button variant="ghost" onClick={handleSignOut} className="rounded-full gap-2 active:scale-95 transition-all duration-200 text-t3 hover:text-destructive">
                    Sign out
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "My Journey" && (
            <div className="space-y-6">
              <div className="glass-card p-6" style={{ borderColor: "var(--brand)", borderStyle: "dashed", borderWidth: "2px" }}>
                <h3 className="text-[18px] font-extrabold text-t1 mb-1">Your chapter is changing. What's next?</h3>
                <p className="text-[13px] text-t2">Your project history always stays. Your role and badge updates instantly.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {journeyCards.map(c => (
                  <button key={c.id} onClick={() => setJourneyChoice(c.id)}
                    className="glass-card p-5 text-left transition-all duration-200 relative cursor-pointer active:scale-[0.98] group"
                    style={journeyChoice === c.id ? { borderColor: "var(--brand)", background: "var(--brand-dim)" } : {}}>
                    {journeyChoice === c.id && <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}><Check className="w-3 h-3 text-white" /></div>}
                    <c.icon className="w-7 h-7 mb-3 text-brand group-hover:scale-110 transition-transform duration-200" />
                    <h4 className="text-[14px] font-bold text-t1 mb-1">{c.title}</h4>
                    <p className="text-[12px] text-t2">{c.desc}</p>
                  </button>
                ))}
              </div>
              {journeyChoice && <Button className="w-full rounded-full active:scale-95 transition-all duration-200" onClick={() => toast.success("Journey updated!")}>Update my journey</Button>}
            </div>
          )}

          {activeTab === "Privacy" && (
            <div className="glass-card p-6">
              <h3 className="text-[16px] font-bold text-t1 mb-4">Privacy settings</h3>
              <Toggle label="Open to opportunities" desc="Show green dot on profile" />
              <Toggle label="Show profile in Explore" />
              <Toggle label="Show recruiter view count on work" />
              <Toggle label="Allow strand requests" />
              <Toggle label="Show Activity Score publicly" />
              <Toggle label="Show strand count publicly" />
            </div>
          )}

          {activeTab === "Notifications" && (
            <div className="glass-card p-6">
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
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }} onClick={() => setShowDeleteModal(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <AlertTriangle className="w-10 h-10 mx-auto mb-4" style={{ color: "#DC2626" }} />
            <h3 className="text-[18px] font-bold text-center text-t1 mb-2">Delete account?</h3>
            <p className="text-[13px] text-center text-t2 mb-4">Your account will be permanently deleted in 30 days. Type DELETE to confirm.</p>
            <Input value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="DELETE" className="h-11 mb-4 bg-surface-2 border-border/30" />
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 active:scale-95 transition-all duration-200 rounded-full" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="destructive" disabled={deleteText !== "DELETE"} className="flex-1 active:scale-95 transition-all duration-200 rounded-full"
                onClick={() => { setShowDeleteModal(false); toast.success("Account scheduled for deletion in 30 days"); }}>
                Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default SettingsPage;
