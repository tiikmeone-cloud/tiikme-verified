import { useState, useEffect, useRef } from "react";
import { Check, GraduationCap, Briefcase, Rocket, Laptop, Coffee, Sun, Moon, Monitor, Palette, Mail, Key, Download, Trash2, AlertTriangle, Camera, User, Shield, Bell, Eye, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tiikToast } from "@/components/ui/tiik-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const navItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "journey", label: "My Journey", icon: Rocket },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "privacy", label: "Privacy", icon: Eye },
  { id: "institution", label: "Institution", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Account", icon: Lock },
];

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
    <div className="flex items-center justify-between py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
      <div><span className="text-[14px] font-medium" style={{ color: "var(--text-1)" }}>{label}</span>{desc && <p className="text-[12px] mt-0.5" style={{ color: "var(--text-3)" }}>{desc}</p>}</div>
      <button onClick={() => { setOn(!on); tiikToast.success("Preference saved"); }}
        className="w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer active:scale-95"
        style={{ background: on ? "var(--brand)" : "var(--border-2)", transition: "all 0.2s" }}>
        <div className="w-5 h-5 rounded-full bg-white" style={{ transition: "transform 0.2s", transform: on ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [journeyChoice, setJourneyChoice] = useState<string | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("tiikme-theme") || "dark");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: "", headline: "", bio: "", institution: "", city: "", state: "", slug: "", avatar_url: "" });
  const [userId, setUserId] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { applyTheme(theme); }, []);

  // Load profile from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile({
          name: data.full_name || "",
          headline: data.headline || "",
          bio: data.bio || "",
          institution: data.institution_name || "",
          city: data.location_city || "",
          state: data.location_state || "",
          slug: data.username || "",
          avatar_url: data.avatar_url || "",
        });
      }
    };
    loadProfile();
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("tiikme-theme", newTheme);
    applyTheme(newTheme);
    tiikToast.success(`Theme set to ${newTheme}`);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.name,
      headline: profile.headline,
      bio: profile.bio,
      institution_name: profile.institution,
      location_city: profile.city,
      location_state: profile.state,
      username: profile.slug,
    }).eq("id", userId);
    setSaving(false);
    if (error) { tiikToast.error("Failed to save"); return; }
    tiikToast.success("Settings saved ✓");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    if (file.size > 2 * 1024 * 1024) { tiikToast.error("Max 2MB"); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { tiikToast.error("JPEG, PNG, or WebP only"); return; }

    const path = `${userId}/avatar.${file.name.split(".").pop()}`;
    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadErr) { tiikToast.error("Upload failed"); return; }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = urlData.publicUrl + "?t=" + Date.now();
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
    setProfile(p => ({ ...p, avatar_url: avatarUrl }));
    tiikToast.success("Avatar updated ✓");
  };

  const handleSignOut = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    const savedTheme = localStorage.getItem("tiikme-theme");
    localStorage.clear();
    if (savedTheme) localStorage.setItem("tiikme-theme", savedTheme);
    setTimeout(() => navigate("/signin"), 500);
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    await supabase.auth.signOut();
    tiikToast.success("Account scheduled for deletion in 30 days");
    navigate("/");
  };

  return (
    <motion.div
      animate={loggingOut ? { scale: 0.97, opacity: 0 } : { scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="max-w-[960px] mx-auto px-3 md:px-6 py-7"
    >
      <h1 className="text-[20px] font-extrabold mb-5" style={{ color: "var(--text-1)", letterSpacing: "-0.01em" }}>Settings</h1>

      <div className="flex gap-6">
        <div className="hidden md:block w-[200px] shrink-0">
          <div className="sticky top-20 space-y-0.5">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className="w-full text-left text-[13px] px-3 h-[42px] rounded-xl flex items-center gap-2.5 cursor-pointer"
                style={{
                  background: activeTab === item.id ? "var(--brand-dim)" : "transparent",
                  color: activeTab === item.id ? "var(--brand)" : "var(--text-2)",
                  fontWeight: activeTab === item.id ? 700 : 500,
                  transition: "all 0.15s",
                }}>
                <item.icon className="w-4 h-4" strokeWidth={1.8} />
                {item.label}
              </button>
            ))}
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 8 }}>
              <button onClick={handleSignOut}
                className="w-full text-left text-[13px] px-3 h-[42px] rounded-xl flex items-center gap-2.5 cursor-pointer"
                style={{ color: "var(--text-3)", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.06)"; e.currentTarget.style.color = "#DC2626"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)"; }}>
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="md:hidden flex flex-wrap gap-1.5 mb-5">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className="text-[11px] px-3 h-7 rounded-full cursor-pointer"
                style={{
                  background: activeTab === item.id ? "var(--brand)" : "var(--surface-2)",
                  color: activeTab === item.id ? "white" : "var(--text-2)",
                  border: activeTab === item.id ? "none" : "1px solid var(--border)",
                  fontWeight: activeTab === item.id ? 700 : 600,
                  transition: "all 0.15s",
                }}>
                {item.label}
              </button>
            ))}
          </div>

          {activeTab === "profile" && (
            <div className="space-y-5">
              <div className="t-card p-5">
                <h3 className="text-[16px] font-bold mb-5" style={{ color: "var(--text-1)" }}>Profile</h3>
                <div className="flex items-center gap-5 mb-5">
                  <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                    <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white overflow-hidden" style={{ backgroundColor: "var(--brand)" }}>
                      {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : (profile.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "AK")}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center" style={{ transition: "opacity 0.2s" }}>
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{profile.name || "Your Name"}</p>
                    <p className="text-[12px]" style={{ color: "var(--text-3)" }}>Click avatar to change</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-3)", letterSpacing: "0.08em" }}>Display Name</label>
                    <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-3)", letterSpacing: "0.08em" }}>Headline</label>
                    <Input value={profile.headline} onChange={e => setProfile({ ...profile, headline: e.target.value.slice(0, 80) })} maxLength={80} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-3)", letterSpacing: "0.08em" }}>Bio</label>
                    <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value.slice(0, 300) })} placeholder="Tell people about yourself..." rows={3} maxLength={300}
                      className="w-full rounded-xl p-3.5 text-[14px] outline-none resize-none"
                      style={{ background: "var(--surface-2)", border: "1.5px solid var(--border-2)", color: "var(--text-1)", transition: "border 0.15s" }}
                      onFocus={e => e.currentTarget.style.borderColor = "var(--brand)"}
                      onBlur={e => e.currentTarget.style.borderColor = "var(--border-2)"}
                    />
                    <p className="text-[10px] text-right mt-1" style={{ color: "var(--text-3)" }}>{profile.bio.length}/300</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-3)" }}>City</label><Input value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} /></div>
                    <div><label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-3)" }}>State</label><Input value={profile.state} onChange={e => setProfile({ ...profile, state: e.target.value })} /></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px]" style={{ color: "var(--text-3)" }}>tiikme.in/</span>
                    <Input value={profile.slug} onChange={e => setProfile({ ...profile, slug: e.target.value })} className="flex-1" />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
                  </div>
                </div>
              </div>
              <div className="t-card p-5">
                <h3 className="text-[16px] font-bold mb-4" style={{ color: "var(--text-1)" }}>Security</h3>
                <div className="space-y-0">
                  <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3"><Mail className="w-4 h-4" style={{ color: "var(--text-3)" }} /><div><p className="text-[14px]" style={{ color: "var(--text-1)" }}>Email</p><p className="text-[12px]" style={{ color: "var(--text-3)" }}>Primary email</p></div></div>
                    <Button variant="ghost" size="sm" onClick={() => tiikToast("Update flow coming soon")}>Update</Button>
                  </div>
                  <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3"><Key className="w-4 h-4" style={{ color: "var(--text-3)" }} /><div><p className="text-[14px]" style={{ color: "var(--text-1)" }}>Password</p><p className="text-[12px]" style={{ color: "var(--text-3)" }}>Change your password</p></div></div>
                    <Button variant="ghost" size="sm" onClick={() => tiikToast("Password update coming soon")}>Update</Button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3"><Download className="w-4 h-4" style={{ color: "var(--text-3)" }} /><div><p className="text-[14px]" style={{ color: "var(--text-1)" }}>Download my data</p><p className="text-[12px]" style={{ color: "var(--text-3)" }}>Export all your data</p></div></div>
                    <Button variant="ghost" size="sm" onClick={() => tiikToast("Preparing export...")}>Export</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="t-card p-5">
              <h3 className="text-[20px] font-extrabold mb-4" style={{ color: "var(--text-1)" }}>Theme</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "dark", label: "Dark", icon: Moon, desc: "Krishna Blue", previewBg: "#04061A", previewSurface: "#080B2A", previewDot: "#3D5AF1" },
                  { id: "light", label: "Light", icon: Sun, desc: "Anjaneyam Orange", previewBg: "#FFF8F2", previewSurface: "#FFFFFF", previewDot: "#E8580A" },
                  { id: "system", label: "System", icon: Monitor, desc: "Match device" },
                ].map(t => (
                  <button key={t.id} onClick={() => handleThemeChange(t.id)}
                    className="rounded-2xl p-3 text-left cursor-pointer relative overflow-hidden active:scale-[0.98]"
                    style={{
                      background: "var(--surface-2)",
                      border: theme === t.id ? "2px solid var(--brand)" : "1.5px solid var(--border)",
                      boxShadow: theme === t.id ? "0 0 0 3px var(--brand-dim)" : "none",
                      transition: "all 0.2s",
                      width: "100%", height: 92,
                    }}>
                    {theme === t.id && <div className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}><Check className="w-3 h-3 text-white" /></div>}
                    {t.previewBg ? (
                      <div className="w-full h-[55px] rounded-lg mb-2 relative overflow-hidden" style={{ background: t.previewBg }}>
                        <div className="absolute inset-x-2 top-2 h-2 rounded-full" style={{ background: t.previewSurface, opacity: 0.5 }} />
                        <div className="absolute inset-x-2 top-5 h-2 rounded-full" style={{ background: t.previewSurface, opacity: 0.3 }} />
                        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full" style={{ background: t.previewDot }} />
                      </div>
                    ) : (
                      <div className="w-full h-[55px] rounded-lg mb-2 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #04061A 50%, #FFF8F2 50%)" }}>
                        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full" style={{ background: "#3D5AF1" }} />
                        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full" style={{ background: "#E8580A" }} />
                      </div>
                    )}
                    <span className="text-[13px] font-semibold block" style={{ color: "var(--text-2)" }}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "journey" && (
            <div className="space-y-5">
              <div className="t-card p-5" style={{ borderColor: "var(--brand)", borderStyle: "dashed", borderWidth: "2px" }}>
                <h3 className="text-[18px] font-extrabold mb-1" style={{ color: "var(--text-1)" }}>Your chapter is changing. What's next?</h3>
                <p className="text-[13px]" style={{ color: "var(--text-2)" }}>Your project history always stays. Your role and badge updates instantly.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {journeyCards.map(c => (
                  <button key={c.id} onClick={() => setJourneyChoice(c.id)}
                    className="t-card t-card-hover p-5 text-left relative cursor-pointer active:scale-[0.98]"
                    style={journeyChoice === c.id ? { borderColor: "var(--brand)", background: "var(--brand-dim)" } : {}}>
                    {journeyChoice === c.id && <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}><Check className="w-3 h-3 text-white" /></div>}
                    <c.icon className="w-7 h-7 mb-3" style={{ color: "var(--brand)" }} />
                    <h4 className="text-[14px] font-bold mb-1" style={{ color: "var(--text-1)" }}>{c.title}</h4>
                    <p className="text-[12px]" style={{ color: "var(--text-2)" }}>{c.desc}</p>
                  </button>
                ))}
              </div>
              {journeyChoice && <Button className="w-full" size="xl" onClick={() => tiikToast.success("Journey updated!")}>Update my journey</Button>}
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="t-card p-5">
              <h3 className="text-[16px] font-bold mb-4" style={{ color: "var(--text-1)" }}>Privacy settings</h3>
              <Toggle label="Open to opportunities" desc="Show green dot on profile" />
              <Toggle label="Show profile in Explore" />
              <Toggle label="Show recruiter view count on work" />
              <Toggle label="Allow Strand requests" />
              <Toggle label="Show Activity Score publicly" />
              <Toggle label="Show Strand count publicly" />
            </div>
          )}

          {activeTab === "institution" && (
            <div className="t-card p-5">
              <h3 className="text-[16px] font-bold mb-4" style={{ color: "var(--text-1)" }}>Institution</h3>
              <p className="text-[14px] mb-3" style={{ color: "var(--text-2)" }}>You are linked to:</p>
              <div className="t-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-bold" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>
                  {profile.institution?.slice(0, 2).toUpperCase() || "??"}
                </div>
                <div>
                  <p className="text-[14px] font-bold" style={{ color: "var(--text-1)" }}>{profile.institution || "Not set"}</p>
                  <p className="text-[12px]" style={{ color: "var(--text-3)" }}>{profile.city || "Unknown"}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="t-card p-5">
              <h3 className="text-[16px] font-bold mb-4" style={{ color: "var(--text-1)" }}>Notification preferences</h3>
              <Toggle label="Recruiter views my work" />
              <Toggle label="Strand requests received" />
              <Toggle label="Tiik Approvals received" />
              <Toggle label="Opportunity matches" />
              <Toggle label="Replies to my comments" />
              <Toggle label="New Pings (unread)" />
              <Toggle label="Activity Score milestones" defaultOn={false} />
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-5">
              <div className="t-card p-5">
                <h3 className="text-[16px] font-bold mb-4" style={{ color: "var(--text-1)" }}>Account</h3>
                <Button variant="secondary" onClick={handleSignOut} className="gap-2">
                  <LogOut className="w-4 h-4" /> Sign out of all devices
                </Button>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.12)" }}>
                <h3 className="text-[16px] font-bold mb-1" style={{ color: "#DC2626" }}>Delete Account</h3>
                <p className="text-[13px] mb-4" style={{ color: "var(--text-2)" }}>Permanently removes all your data after 30 days.</p>
                <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>Delete my account</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }} onClick={() => setShowDeleteModal(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <AlertTriangle className="w-10 h-10 mx-auto mb-4" style={{ color: "#DC2626" }} />
            <h3 className="text-[18px] font-bold text-center mb-2" style={{ color: "var(--text-1)" }}>Delete account?</h3>
            <p className="text-[13px] text-center mb-1" style={{ color: "var(--text-2)" }}>Type DELETE to confirm.</p>
            <p className="text-[12px] text-center mb-4" style={{ color: "var(--text-3)" }}>30-day hold period — you can cancel by signing in.</p>
            <Input value={deleteText} onChange={e => setDeleteText(e.target.value)} placeholder="DELETE" className="mb-4" />
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="destructive" disabled={deleteText !== "DELETE"} className="flex-1" onClick={handleDeleteAccount}>
                Confirm deletion
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default SettingsPage;
